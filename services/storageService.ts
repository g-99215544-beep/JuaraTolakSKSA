import { ScoreRecord } from '../types';
import { saveScoreToFirebase, getScoresFromFirebase, clearAllScoresFirebase } from './firebaseService';

// Fungsi untuk menyemak waktu sekolah
// Isnin (1) hingga Jumaat (5)
// 6:30 Pagi hingga 2:00 Petang (14:00)
export const isSchoolHours = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0 = Ahad, 1 = Isnin, ..., 6 = Sabtu
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Tukar masa semasa kepada minit dari tengah malam
  const currentTotalMinutes = hour * 60 + minute;

  // 6:30 Pagi = 6 * 60 + 30 = 390 minit
  const startTotalMinutes = 6 * 60 + 30;
  // 2:00 Petang = 14 * 60 = 840 minit
  const endTotalMinutes = 14 * 60;

  const isWeekday = day >= 1 && day <= 5; // Isnin hingga Jumaat
  const isTimeInRange = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;

  return isWeekday && isTimeInRange;
};

// Returns true if saved (ranked), false if practice mode (outside hours)
export const saveScore = async (name: string, className: string, score: number): Promise<boolean> => {
  if (isSchoolHours()) {
    await saveScoreToFirebase(name, className, score);
    return true;
  }
  // Jika luar waktu sekolah, jangan simpan ke database (ranking)
  return false;
};

export const getScores = async (): Promise<ScoreRecord[]> => {
  return await getScoresFromFirebase();
};

export const getTopScore = async (): Promise<ScoreRecord | null> => {
  const scores = await getScoresFromFirebase();
  if (scores.length === 0) return null;
  // Sort descending
  scores.sort((a, b) => b.score - a.score);
  return scores[0];
};

export const clearScores = async (): Promise<void> => {
  await clearAllScoresFirebase();
};