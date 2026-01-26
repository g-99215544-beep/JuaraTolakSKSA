import React, { useEffect, useState, useRef } from 'react';
import { RetroButton, RetroPanel, CrownIcon } from './RetroUI';
import { getScores } from '../services/storageService';
import { ScoreRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LeaderboardProps {
  onBack: () => void;
  highlightParams?: { name: string, className: string, score: number } | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, highlightParams }) => {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref untuk scroll ke element murid
  const currentUserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadScores = async () => {
      setIsLoading(true);
      const allScores = await getScores();
      allScores.sort((a, b) => b.score - a.score);
      setScores(allScores);
      
      const uniqueClasses = Array.from(new Set(allScores.map(s => s.className))).sort();
      setAvailableClasses(uniqueClasses);
      setIsLoading(false);
    };
    loadScores();
  }, []); // Run once on mount

  // Auto-scroll effect bila data loaded DAN ada highlightParams
  useEffect(() => {
    if (!isLoading && highlightParams && currentUserRef.current) {
        // Delay sedikit untuk memastikan render selesai
        setTimeout(() => {
            currentUserRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }
  }, [isLoading, highlightParams, filter, scores]);

  const filteredScores = filter === 'ALL' 
    ? scores 
    : scores.filter(s => s.className === filter);

  const chartData = filteredScores.slice(0, 5).map(s => ({
    name: s.name.substring(0, 6), 
    score: s.score
  }));

  // Helper untuk check adakah ini rekod murid sekarang
  const isCurrentUser = (record: ScoreRecord) => {
      if (!highlightParams) return false;
      return record.name === highlightParams.name && 
             record.className === highlightParams.className && 
             record.score === highlightParams.score;
  };

  return (
    <RetroPanel className="w-full max-w-lg h-[85vh] flex flex-col relative">
      
      {/* Banner Markah Anda (Jika baru lepas main) */}
      {highlightParams && (
         <div className="absolute -top-4 left-0 w-full flex justify-center z-20 animate-pop">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-nunito font-bold px-6 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-2">
                <span>MARKAH ANDA:</span>
                <span className="text-xl font-black text-yellow-300">{highlightParams.score}</span>
            </div>
         </div>
      )}

      <div className={`text-center mb-4 ${highlightParams ? 'mt-6' : ''}`}>
        <h2 className="text-2xl font-black text-slate-800">PAPAN MARKAH</h2>
        
        {/* Filter Controls */}
        <div className="flex justify-center items-center gap-2 mt-4">
            <div className="relative">
                <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="font-bold text-sm py-2 px-4 rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm outline-none appearance-none pr-8 cursor-pointer hover:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all"
                >
                    <option value="ALL">SEMUA (SEKOLAH)</option>
                    {availableClasses.map(cls => (
                        <option key={cls} value={cls}>KELAS {cls}</option>
                    ))}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Recharts Visualization for Top 5 (Hanya tunjuk jika TIADA highlight atau jika user scroll ke atas) */}
          {/* Kita sembunyikan chart jika list panjang dan user perlu discroll ke bawah, tapi user boleh scroll naik */}
          {filteredScores.length > 0 && (
            <div className="h-40 w-full bg-gradient-to-b from-cyan-50 to-white rounded-2xl mb-4 p-4 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 10, fontFamily: '"Nunito"', fontWeight: 'bold', fill: '#64748B'}} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ 
                            fontFamily: '"Nunito"', 
                            fontSize: '12px', 
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontWeight: 'bold'
                        }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#EAB308' : '#06B6D4'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            </div>
          )}

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar relative">
            {filteredScores.length === 0 ? (
              <p className="text-center font-bold text-slate-400 mt-10">TIADA REKOD LAGI.</p>
            ) : (
              filteredScores.map((record, index) => {
                const highlighted = isCurrentUser(record);
                return (
                    <div 
                      key={record.id} 
                      ref={highlighted ? currentUserRef : null}
                      className={`flex justify-between items-center p-4 rounded-xl shadow-sm transition-all duration-500 ${
                          highlighted 
                            ? 'bg-cyan-100 border-2 border-cyan-500 scale-[1.03] shadow-glow z-10' 
                            : index === 0 
                                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200' 
                                : 'bg-white border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                         <div className={`
                            w-8 h-8 flex items-center justify-center rounded-full font-black text-sm
                            ${highlighted ? 'bg-cyan-600 text-white' : 
                              index === 0 ? 'bg-yellow-400 text-white' : 
                              index === 1 ? 'bg-slate-300 text-white' : 
                              index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'}
                         `}>
                            {index + 1}
                         </div>
                         <div className="flex flex-col text-left">
                            <span className={`font-bold text-sm ${highlighted ? 'text-cyan-900' : 'text-slate-800'}`}>
                                {record.name} {highlighted && '(ANDA)'}
                            </span>
                            <span className={`text-xs font-semibold ${highlighted ? 'text-cyan-700' : 'text-slate-400'}`}>
                                {record.className}
                            </span>
                         </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`font-black text-lg ${index === 0 ? 'text-amber-600' : 'text-cyan-600'}`}>
                            {record.score}
                        </span>
                        {index === 0 && <CrownIcon className="w-5 h-5 ml-2 -mt-1" />}
                      </div>
                    </div>
                );
              })
            )}
          </div>
        </>
      )}

      <div className="mt-4 shrink-0">
        <RetroButton onClick={onBack} variant="secondary" fullWidth>
            {highlightParams ? 'MAIN LAGI' : 'KEMBALI'}
        </RetroButton>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}</style>
    </RetroPanel>
  );
};

export default Leaderboard;
