export enum ScreenState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD'
}

export interface Player {
  name: string;
  className: string;
}

export interface ScoreRecord {
  id: string;
  name: string;
  className: string;
  score: number;
  timestamp: number;
}

export interface Question {
  num1: number;
  num2: number;
  answer: number;
  options: number[];
}

export interface GameConfig {
  duration: number; // seconds
  maxLives: number;
  bonusTimeLimit: number; // seconds to get bonus
  comboRequirement: number;
}