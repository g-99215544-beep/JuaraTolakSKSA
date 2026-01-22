import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, child, set, remove } from 'firebase/database';
import { ScoreRecord } from '../types';

// --- CONFIG 1: Main App (Untuk Simpan Markah & Ranking) ---
// Menggunakan configuration baru yang diminta
const scoreConfig = {
  apiKey: "AIzaSyAn-FAtu6O2e3iaBBPBVeKFhq81D3OT3fU",
  authDomain: "superb-app-480510-f9.firebaseapp.com",
  databaseURL: "https://superb-app-480510-f9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "superb-app-480510-f9",
  storageBucket: "superb-app-480510-f9.firebasestorage.app",
  messagingSenderId: "999358020770",
  appId: "1:999358020770:web:7d4fa4b1e6d154e9aa6bfb",
  measurementId: "G-P7WCX2SCT0"
};

// --- CONFIG 2: Kehadiran Murid (Untuk Senarai Nama/Kelas) ---
// Kekalkan config ini untuk mengambil senarai nama murid sedia ada
const classDataConfig = {
  apiKey: "AIzaSyDbCgDz2vK2BZUpwM3iDWJcPQSptVcNkv4",
  authDomain: "kehadiran-murid-6ece0.firebaseapp.com",
  databaseURL: "https://kehadiran-murid-6ece0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kehadiran-murid-6ece0",
  storageBucket: "kehadiran-murid-6ece0.firebasestorage.app",
  messagingSenderId: "223849234784",
  appId: "1:223849234784:web:e1471ded7ea17ba60bde05",
  measurementId: "G-4DY138HKTW"
};

// Initialize Apps
// Semak jika app sudah wujud untuk mengelakkan error "App already exists"
let scoreApp;
if (getApps().length === 0) {
  scoreApp = initializeApp(scoreConfig); // Default app
} else {
  scoreApp = getApp(); 
}

let classDataApp;
try {
  classDataApp = getApp("classDataApp");
} catch (e) {
  classDataApp = initializeApp(classDataConfig, "classDataApp"); // Named app
}

// Dapatkan instance Database yang berasingan
const dbScores = getDatabase(scoreApp);
const dbClassData = getDatabase(classDataApp);

export interface ClassData {
  [className: string]: string[];
}

// Fetch class data MENGGUNAKAN dbClassData (Kehadiran Murid)
export const fetchClassData = async (): Promise<ClassData | null> => {
  try {
    const dbRef = ref(dbClassData);
    // Mengambil data dari path 'config/classes/classData' dalam projek Kehadiran
    const snapshot = await get(child(dbRef, 'config/classes/classData'));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn("No class data available in Kehadiran DB");
      return null;
    }
  } catch (error) {
    console.error("Error fetching class data:", error);
    return null;
  }
};

// Save score MENGGUNAKAN dbScores (Main App)
// DATA DISIMPAN DALAM FOLDER 'tolak/scores'
export const saveScoreToFirebase = async (name: string, className: string, score: number): Promise<void> => {
    // Sanitize keys
    const safeName = name.replace(/[.#$[\]]/g, "_");
    const safeClass = className.replace(/[.#$[\]]/g, "_");
    const recordKey = `${safeClass}_${safeName}`;
    
    // Path dikemaskini ke 'tolak/scores'
    const dbRef = ref(dbScores, `tolak/scores/${recordKey}`);
    
    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const currentData = snapshot.val();
            // LOGIC: Hanya update jika markah baharu lebih tinggi
            if (score > currentData.score) {
                 await set(dbRef, {
                    id: recordKey,
                    name,
                    className,
                    score,
                    timestamp: Date.now()
                });
            }
        } else {
            // Create rekod baharu
            await set(dbRef, {
                id: recordKey,
                name,
                className,
                score,
                timestamp: Date.now()
            });
        }
    } catch (e) {
        console.error("Error saving score to Firebase", e);
    }
};

// Get scores MENGGUNAKAN dbScores (Main App)
// DATA DIAMBIL DARI FOLDER 'tolak/scores'
export const getScoresFromFirebase = async (): Promise<ScoreRecord[]> => {
    try {
        // Path dikemaskini ke 'tolak/scores'
        const dbRef = ref(dbScores, 'tolak/scores');
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.values(data) as ScoreRecord[];
        }
        return [];
    } catch (e) {
        console.error("Error fetching scores from Firebase", e);
        return [];
    }
}

// Clear scores MENGGUNAKAN dbScores (Main App)
// DATA DIPADAM DARI FOLDER 'tolak/scores'
export const clearAllScoresFirebase = async (): Promise<void> => {
    try {
        // Path dikemaskini ke 'tolak/scores'
        const dbRef = ref(dbScores, 'tolak/scores');
        await remove(dbRef);
    } catch (e) {
        console.error("Error clearing scores in Firebase", e);
    }
}