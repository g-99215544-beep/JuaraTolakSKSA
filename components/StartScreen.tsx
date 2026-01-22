import React, { useState, useEffect } from 'react';
import { RetroButton, RetroPanel, CrownIcon, TrophyIcon } from './RetroUI';
import { getTopScore, clearScores, getScores } from '../services/storageService';
import { Player } from '../types';
import { fetchClassData, ClassData } from '../services/firebaseService';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface StartScreenProps {
  onStart: (player: Player) => void;
  onShowLeaderboard: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onShowLeaderboard }) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [topScore, setTopScore] = useState<{name: string, score: number} | null>(null);
  
  const [allClassData, setAllClassData] = useState<ClassData | null>(null);
  const [classList, setClassList] = useState<string[]>([]);
  const [studentList, setStudentList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin states
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pdfFilterClass, setPdfFilterClass] = useState('ALL');

  const loadTopScore = async () => {
    const record = await getTopScore();
    if (record) {
      setTopScore({ name: record.name, score: record.score });
    } else {
      setTopScore(null);
    }
  };

  useEffect(() => {
    loadTopScore();
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchClassData();
      if (data) {
        setAllClassData(data);
        setClassList(Object.keys(data).sort());
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClass = e.target.value;
    setClassName(selectedClass);
    setName('');
    
    if (selectedClass && allClassData && allClassData[selectedClass]) {
      setStudentList(allClassData[selectedClass].sort());
    } else {
      setStudentList([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && className.trim()) {
      onStart({ name: name.toUpperCase(), className: className.toUpperCase() });
    }
  };

  // --- Admin Functions ---
  const handleCrownClick = () => {
    setShowAdminAuth(true);
    setAdminPassword('');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setShowAdminAuth(false);
      setShowAdminPanel(true);
      setPdfFilterClass('ALL'); 
    } else {
      alert("KATA LALUAN SALAH!");
      setAdminPassword('');
    }
  };

  const handleResetData = async () => {
    if (window.confirm("ADAKAH ANDA PASTI? SEMUA REKOD MARKAH AKAN DIPADAM!")) {
      await clearScores();
      await loadTopScore();
      alert("REKOD TELAH DIPADAM!");
      setShowAdminPanel(false);
    }
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    let scores = await getScores();
    let titleSuffix = "";
    
    let headRows: string[][] = [];
    let bodyRows: (string | number)[][] = [];
    let colStyles: any = {};

    if (pdfFilterClass === 'ALL') {
      titleSuffix = "TOP 10 TERBAIK SEKOLAH";
      scores.sort((a, b) => b.score - a.score);
      const top10 = scores.slice(0, 10);
      
      if (top10.length === 0) { alert("TIADA REKOD."); return; }

      headRows = [['No.', 'Nama', 'Kelas', 'Markah', 'Tarikh']];
      bodyRows = top10.map((s, index) => [
        index + 1, s.name, s.className, s.score, new Date(s.timestamp).toLocaleDateString()
      ]);
      colStyles = { 0: { halign: 'center', cellWidth: 15 }, 3: { halign: 'center', cellWidth: 25 }, 4: { halign: 'center', cellWidth: 30 } };

    } else if (pdfFilterClass === 'SUMMARY_TOP3') {
      titleSuffix = "TOP 3 SETIAP KELAS";
      const classMap: Record<string, typeof scores> = {};
      scores.forEach(s => {
        if (!classMap[s.className]) classMap[s.className] = [];
        classMap[s.className].push(s);
      });
      const classes = Object.keys(classMap).sort();
      if (classes.length === 0) { alert("TIADA REKOD."); return; }

      headRows = [['Kelas', 'Ked.', 'Nama', 'Markah']];
      classes.forEach(cls => {
        const clsScores = classMap[cls].sort((a, b) => b.score - a.score);
        const top3 = clsScores.slice(0, 3);
        top3.forEach((s, idx) => {
          bodyRows.push([cls, idx + 1, s.name, s.score]);
        });
      });
      colStyles = { 0: { cellWidth: 25 }, 1: { halign: 'center', cellWidth: 15 }, 3: { halign: 'center', cellWidth: 25 } };

    } else {
      titleSuffix = `KELAS ${pdfFilterClass}`;
      scores = scores.filter(s => s.className === pdfFilterClass);
      scores.sort((a, b) => b.score - a.score);
      if (scores.length === 0) { alert("TIADA REKOD UNTUK KELAS INI."); return; }

      headRows = [['No.', 'Nama', 'Markah', 'Tarikh']];
      bodyRows = scores.map((s, index) => [
        index + 1, s.name, s.score, new Date(s.timestamp).toLocaleDateString()
      ]);
      colStyles = { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'center', cellWidth: 25 }, 3: { halign: 'center', cellWidth: 30 } };
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(6, 182, 212); // Cyan text for PDF
    doc.text(`JUARA TOLAK - ${titleSuffix}`, 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tarikh Cetakan: ${new Date().toLocaleDateString()}`, 105, 28, { align: "center" });

    autoTable(doc, {
      head: headRows,
      body: bodyRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], halign: 'center' }, // Cyan header
      columnStyles: colStyles
    });

    const filename = `ranking-tolak-${pdfFilterClass.toLowerCase().replace(/\s/g, '-')}.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <RetroPanel className="w-full max-w-md text-center animate-pop relative z-10">
        <div className="flex justify-center mb-2">
          <div onClick={handleCrownClick} className="cursor-pointer hover:scale-110 transition-transform hover:rotate-6" title="Admin Login">
            <CrownIcon className="w-24 h-24 drop-shadow-glow" />
          </div>
        </div>
        
        {/* NEW TITLE COLORS */}
        <h1 className="text-4xl font-black font-nunito mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 leading-tight">
          JUARA<br/><span className="text-3xl text-rose-500">TOLAK</span>
        </h1>
        
        <p className="text-slate-400 font-bold mb-8 text-sm tracking-widest uppercase">SK SRI AMAN</p>

        {/* Champion Card - Cool Blue Theme */}
        <div className="relative bg-gradient-to-r from-blue-50 to-cyan-50 p-4 mb-8 rounded-2xl shadow-inner border border-blue-100">
          <div 
            onClick={onShowLeaderboard}
            className="absolute -top-4 -right-4 z-10 cursor-pointer hover:scale-110 transition-transform p-2 bg-white rounded-full shadow-md"
            title="Papan Markah"
          >
             <TrophyIcon className="w-8 h-8 text-yellow-500" />
          </div>

          {topScore ? (
            <div>
              <span className="text-cyan-600 font-extrabold text-xs uppercase tracking-wide">JUARA SEMASA</span>
              <div className="flex flex-col items-center mt-1">
                  <span className="text-lg font-black text-gray-800">{topScore.name}</span>
                  <span className="text-2xl font-black text-blue-500">{topScore.score}</span>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 font-bold">Jadilah Juara Pertama!</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoading ? (
            <div className="font-nunito font-bold animate-pulse text-cyan-500 py-4">
              MEMUAT TURUN DATA...
            </div>
          ) : (
            <>
              <div className="relative group">
                  <select 
                    value={className}
                    onChange={handleClassChange}
                    className="w-full font-nunito font-bold p-4 rounded-xl border-2 border-slate-200 outline-none text-slate-700 bg-slate-50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>PILIH KELAS</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>

              <div className="relative">
                  <select 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full font-nunito font-bold p-4 rounded-xl border-2 border-slate-200 outline-none text-slate-700 bg-slate-50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 transition-all appearance-none cursor-pointer ${!className ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={!className}
                  >
                    <option value="" disabled>PILIH NAMA</option>
                    {studentList.map(student => (
                      <option key={student} value={student}>{student}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
            </>
          )}
          
          <div className="pt-4">
            <RetroButton 
                type="submit" 
                fullWidth 
                disabled={isLoading}
                className="shadow-glow"
            >
              MULA SEKARANG
            </RetroButton>
          </div>
        </form>
      </RetroPanel>

      {/* Admin Login Modal */}
      {showAdminAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
           <RetroPanel className="w-full max-w-sm animate-pop">
              <h3 className="font-nunito font-bold text-lg text-center mb-4 text-gray-700">Login Admin</h3>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                 <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Kata Laluan"
                    className="w-full p-3 rounded-lg border border-gray-300 text-center font-bold"
                    autoFocus
                 />
                 <div className="flex gap-2">
                    <RetroButton type="button" variant="secondary" fullWidth onClick={() => setShowAdminAuth(false)}>Batal</RetroButton>
                    <RetroButton type="submit" fullWidth>Masuk</RetroButton>
                 </div>
              </form>
           </RetroPanel>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
           <RetroPanel className="w-full max-w-sm animate-pop bg-white">
              <h3 className="font-nunito font-bold text-xl text-center mb-6 text-cyan-600">Panel Admin</h3>
              
              <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-2">PILIH CETAKAN:</label>
                  <div className="relative">
                    <select 
                        value={pdfFilterClass}
                        onChange={(e) => setPdfFilterClass(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none appearance-none font-bold"
                    >
                        <option value="ALL">TOP 10 SEKOLAH</option>
                        <option value="SUMMARY_TOP3">JUARA KELAS (TOP 3)</option>
                        <option disabled>────────────────</option>
                        {classList.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                  </div>
              </div>

              <div className="space-y-3">
                 <RetroButton onClick={handleDownloadPDF} fullWidth className="bg-gradient-to-r from-blue-500 to-cyan-500">
                    Cetak PDF
                 </RetroButton>
                 <RetroButton onClick={handleResetData} variant="danger" fullWidth>
                    Reset Ranking
                 </RetroButton>
                 <div className="h-2"></div>
                 <RetroButton onClick={() => setShowAdminPanel(false)} variant="secondary" fullWidth>
                    Tutup
                 </RetroButton>
              </div>
           </RetroPanel>
        </div>
      )}
    </>
  );
};

export default StartScreen;