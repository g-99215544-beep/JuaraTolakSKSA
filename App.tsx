import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen'; // Still imported but unused in new flow
import Leaderboard from './components/Leaderboard';
import { ScreenState, Player } from './types';
import { saveScore } from './services/storageService';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>(ScreenState.START);
  const [player, setPlayer] = useState<Player>({ name: '', className: '' });
  const [finalScore, setFinalScore] = useState(0);
  
  // State untuk pass info ke Leaderboard untuk highlighting
  const [highlightInfo, setHighlightInfo] = useState<{name: string, className: string, score: number} | null>(null);

  const handleStartGame = (newPlayer: Player) => {
    setPlayer(newPlayer);
    setScreen(ScreenState.PLAYING);
    setHighlightInfo(null); // Reset highlight info
  };

  const handleEndGame = async (score: number, correctCount: number) => {
    setFinalScore(score);
    
    // Simpan markah di background
    await saveScore(player.name, player.className, score);
    
    // Set info untuk highlight di leaderboard
    setHighlightInfo({
      name: player.name,
      className: player.className,
      score: score
    });

    // Terus ke Leaderboard (SKIP GameOverScreen)
    setScreen(ScreenState.LEADERBOARD);
  };

  const handleBackToStart = () => {
    setScreen(ScreenState.START);
    setFinalScore(0);
    setHighlightInfo(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
      
      {/* Modern Background Bubbles - Updated for Cyan/Blue Theme */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-300 rounded-full mix-blend-overlay filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-overlay filter blur-2xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>

      {screen === ScreenState.START && (
        <StartScreen 
          onStart={handleStartGame} 
          onShowLeaderboard={() => setScreen(ScreenState.LEADERBOARD)} 
        />
      )}

      {screen === ScreenState.PLAYING && (
        <GameScreen 
          player={player} 
          onEndGame={handleEndGame} 
        />
      )}

      {/* Note: GameOverScreen is bypassed based on new requirements */}

      {screen === ScreenState.LEADERBOARD && (
        <Leaderboard 
          onBack={handleBackToStart}
          highlightParams={highlightInfo}
        />
      )}
    </div>
  );
};

export default App;
