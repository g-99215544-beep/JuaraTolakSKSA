import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RetroButton, RetroPanel } from './RetroUI';
import { soundService } from '../services/soundService';
import { Player, Question } from '../types';

interface GameScreenProps {
  player: Player;
  onEndGame: (score: number, correctCount: number) => void;
}

const GAME_DURATION = 60;
const BONUS_TIME_LIMIT = 5; // seconds
const QUESTION_TIME_LIMIT = 10; // seconds

const GameScreen: React.FC<GameScreenProps> = ({ player, onEndGame }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(2);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{text: string, color: string} | null>(null);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [qNumDisplay, setQNumDisplay] = useState(1);

  const questionStartTimeRef = useRef<number>(0);
  const questionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionNumberRef = useRef(1);
  // Ref untuk simpan soalan terakhir bagi mengelakkan ulangan
  const lastQuestionRef = useRef<{num1: number, num2: number} | null>(null);
  
  const generateQuestion = useCallback(() => {
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);

    const qIdx = questionNumberRef.current;
    setQNumDisplay(qIdx);

    let num1 = 0, num2 = 0;
    let isDuplicate = false;
    let attempts = 0;

    // Loop untuk memastikan soalan tidak sama dengan yang sebelumnya
    do {
        attempts++;
        if (qIdx <= 5) {
          // EASY (1-5): 1 Digit tolak 1 Digit
          num1 = Math.floor(Math.random() * 5) + 5; // 5 to 9
          num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
          if (num2 <= 0) num2 = 1;

        } else {
          // MEDIUM & HARD: 2 Digit tolak 1 Digit (DENGAN PENGUMPULAN SEMULA)
          if (qIdx <= 10) {
            // MEDIUM (6-10): Nombor belasan rendah (10-14)
            num1 = Math.floor(Math.random() * 5) + 10; 
          } else {
            // HARD (11+): Nombor belasan tinggi (15-18)
            num1 = Math.floor(Math.random() * 4) + 15; 
          }

          // LOGIC PENGUMPULAN SEMULA
          const onesDigit = num1 % 10;
          const minNum2 = onesDigit + 1;
          const maxNum2 = 9;

          if (minNum2 <= maxNum2) {
             num2 = Math.floor(Math.random() * (maxNum2 - minNum2 + 1)) + minNum2;
          } else {
             num2 = 9;
          }
        }

        // Check if duplicate of last question
        if (lastQuestionRef.current && 
            lastQuestionRef.current.num1 === num1 && 
            lastQuestionRef.current.num2 === num2) {
            isDuplicate = true;
        } else {
            isDuplicate = false;
        }

    } while (isDuplicate && attempts < 5); // Cuba max 5 kali, kalau tak dapat juga terima saja (elak infinite loop)

    // Simpan soalan semasa sebagai 'last question'
    lastQuestionRef.current = { num1, num2 };
    
    // Final Calculation
    const answer = num1 - num2;
    
    // Generate Options
    const options = new Set<number>();
    options.add(answer);
    
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 3) + 1;
      const wrong = answer + (Math.random() > 0.5 ? offset : -offset);
      if (wrong >= 0 && wrong !== answer) options.add(wrong);
    }
    
    const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);
    
    setQuestion({ num1, num2, answer, options: shuffledOptions });
    questionStartTimeRef.current = Date.now();
    questionNumberRef.current += 1;
    
    questionTimeoutRef.current = setTimeout(() => {
      handleTimeUp();
    }, QUESTION_TIME_LIMIT * 1000);
    
  }, []);

  useEffect(() => {
    generateQuestion();
    return () => {
      if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev <= 11) { 
            soundService.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      endGame();
    }
  }, [timeLeft]);

  const endGame = () => {
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    onEndGame(score, correctCount);
  };

  const showFloatingFeedback = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 800);
  };

  const handleTimeUp = () => {
    soundService.playWrong();
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives < 0) {
        endGame();
        return 0;
      }
      return newLives;
    });
    setCombo(0);
    showFloatingFeedback('MASA TAMAT!', 'text-rose-500');
    generateQuestion();
  };

  const handleAnswer = (selected: number) => {
    if (!question) return;
    
    const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
    
    if (selected === question.answer) {
      soundService.playCorrect();
      let points = 10;
      
      if (timeTaken < BONUS_TIME_LIMIT) {
        points += 5;
        showFloatingFeedback('PANTAS! +15', 'text-yellow-500');
      } else {
        showFloatingFeedback('BETUL! +10', 'text-emerald-500');
      }
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > 0 && newCombo % 3 === 0) {
        points += 20;
        showFloatingFeedback('KOMBO! +20', 'text-cyan-500');
      }

      setScore((prev) => prev + points);
      setCorrectCount(prev => prev + 1);
    } else {
      soundService.playWrong();
      setCombo(0);
      showFloatingFeedback('SALAH!', 'text-rose-500');
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives < 0) {
            return -1; 
        }
        return newLives;
      });
    }
    generateQuestion();
  };
  
  useEffect(() => {
      if (lives < 0) {
          endGame();
      }
  }, [lives]);

  return (
    <div className="relative w-full max-w-md h-full py-4">
      <RetroPanel className="h-full flex flex-col justify-between relative overflow-hidden shadow-2xl">
        
        {/* Header Stats */}
        <div className="flex justify-between items-center mb-6 font-nunito font-bold">
          <div className="text-gray-700 truncate max-w-[50%] bg-gray-100 px-3 py-1 rounded-full">{player.name}</div>
          <div className="flex space-x-1">
            {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
              <span key={i} className="text-rose-500 text-xl animate-pulse">❤️</span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex flex-col items-center">
             <span className="text-xs text-slate-400 font-bold uppercase">Skor</span>
             <span className="text-2xl font-black text-cyan-600">{score}</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-xs text-slate-400 font-bold uppercase">Soalan</span>
             <span className="text-xl font-black text-slate-600">{qNumDisplay}</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-xs text-slate-400 font-bold uppercase">Masa</span>
             <span className={`text-2xl font-black ${timeLeft < 10 ? 'text-rose-500 animate-ping' : 'text-slate-800'}`}>{timeLeft}</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center relative w-full">
            
            <div className="relative w-full mb-8">
                {feedback && (
                    <div className="absolute -top-16 left-0 w-full flex justify-center z-10 pointer-events-none">
                         <div className={`font-nunito font-black text-lg ${feedback.color} bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg animate-pop`}>
                             {feedback.text}
                         </div>
                    </div>
                )}

                {/* Updated gradient to Cyan/Blue */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-8 w-full text-center rounded-3xl shadow-glow transform transition-all">
                    <p className="text-7xl font-black text-white tracking-wider">
                        {question ? `${question.num1} - ${question.num2}` : '...'}
                    </p>
                </div>
            </div>
            
             {/* Circular Modern Timer Bar - Updated Colors */}
             <div className="w-full h-3 bg-gray-200 rounded-full mb-8 relative overflow-hidden">
                 <div 
                   key={question ? `${question.num1}-${question.num2}-${combo}` : 'init'}
                   className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full origin-left"
                   style={{
                       animation: `shrink ${QUESTION_TIME_LIMIT}s linear forwards`
                   }}
                 />
                 <div className="absolute top-0 left-[50%] w-0.5 h-full bg-white/50"></div>
             </div>
        </div>

        {/* Answer Grid - Updated Size to 8XL for massive visibility */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
            {question?.options.map((opt, idx) => (
                <RetroButton 
                    key={idx} 
                    onClick={() => handleAnswer(opt)}
                    className="text-8xl py-10 hover:bg-cyan-50"
                >
                    {opt}
                </RetroButton>
            ))}
        </div>

      </RetroPanel>
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default GameScreen;