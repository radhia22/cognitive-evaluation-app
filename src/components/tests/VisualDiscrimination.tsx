import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface VisualDiscriminationProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

export default function VisualDiscrimination({ isTraining, onComplete, language }: VisualDiscriminationProps) {
  const [patterns, setPatterns] = useState<{ p1: number[]; p2: number[]; isSame: boolean } | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [difficultyLevel, setDifficultyLevel] = useState(1); // 1, 2, or 3
  const [stats, setStats] = useState({ correct: 0, errors: 0, totalTime: 0 });
  const [startTime, setStartTime] = useState(0);
  
  const maxRounds = isTraining ? 3 : 6; // 6 rounds total (2 per level)

  const getGridSize = () => {
    if (difficultyLevel === 1) return 3; // 3x3 grid
    if (difficultyLevel === 2) return 4; // 4x4 grid
    return 5; // 5x5 grid
  };

  useEffect(() => {
    generatePatterns();
  }, [currentRound]);

  const generatePatterns = () => {
    const size = getGridSize();
    const cellsCount = size * size;
    const isSame = Math.random() > 0.5;
    
    // Choose pattern fill probability depending on difficulty
    const fillProb = difficultyLevel === 1 ? 0.3 : difficultyLevel === 2 ? 0.4 : 0.5;
    const p1 = Array.from({ length: cellsCount }, () => Math.random() < fillProb ? 1 : 0);
    let p2 = [...p1];
    
    if (!isSame) {
      // Pick a random cell and invert it to create exactly 1 difference
      const idx = Math.floor(Math.random() * p2.length);
      p2[idx] = p2[idx] === 1 ? 0 : 1;
    }

    setPatterns({ p1, p2, isSame });
    setStartTime(Date.now());
  };

  const handleResponse = (response: boolean) => {
    if (!patterns) return;
    
    const reactionTime = Date.now() - startTime;
    const isCorrect = response === patterns.isSame;

    setStats(s => ({
      ...s,
      correct: isCorrect ? s.correct + 1 : s.correct,
      errors: isCorrect ? s.errors : s.errors + 1,
      totalTime: s.totalTime + reactionTime
    }));

    if (currentRound >= maxRounds) {
      // Complete
      const finalAccuracy = (stats.correct + (isCorrect ? 1 : 0)) / maxRounds;
      onComplete({
        averageReactionTime: stats.correct > 0 ? stats.totalTime / stats.correct : reactionTime,
        correctCount: stats.correct + (isCorrect ? 1 : 0),
        errorCount: stats.errors + (isCorrect ? 0 : 1),
        accuracy: finalAccuracy
      }, []);
    } else {
      // Next round difficulty escalates every 2 rounds
      if (currentRound % 2 === 0) {
        setDifficultyLevel(dl => Math.min(3, dl + 1));
      }
      setCurrentRound(prev => prev + 1);
    }
  };

  const gridSize = getGridSize();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] max-w-xl mx-auto">
      <div className="mb-6 flex justify-between w-full text-slate-400 font-mono text-[10px] uppercase tracking-widest px-4">
        <div>ROUND {currentRound} / {maxRounds}</div>
        <div className="text-primary-600 font-bold">DIFFICULTY LEVEL {difficultyLevel}/3</div>
        <div>GRID: {gridSize}x{gridSize}</div>
      </div>

      <div className="mb-8 text-center px-4">
        <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">
          {language === 'ar' ? 'هل النمطان الجانبيان متطابقان أم مختلفان؟' : 'Les deux motifs latéraux sont-ils identiques ?'}
        </h3>
        <p className="text-slate-600 text-xs">
          {language === 'ar' 
            ? 'قارن بين الشبكتين اليسرى واليمنى بدقة واستخرج الاختلافات!' 
            : 'Comparez attentivement les deux grilles à gauche et à droite !'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 mb-12 px-4 w-full justify-center items-center">
        {[patterns?.p1, patterns?.p2].map((p, idx) => (
          <div key={idx} className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner flex-1 flex justify-center items-center aspect-square max-w-[180px]">
             <div 
               className="grid gap-1.5 w-full h-full"
               style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
             >
                {p?.map((val, i) => (
                  <div 
                    key={i} 
                    className={`w-full aspect-square rounded-lg transition-all duration-300 ${
                      val === 1 
                        ? 'bg-primary-500 shadow-md' 
                        : 'bg-slate-200/80'
                    }`} 
                  />
                ))}
             </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={() => handleResponse(false)}
          className="flex-1 h-20 bg-red-600/10 border-2 border-red-500/20 text-red-500 rounded-2xl font-black text-lg hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-md cursor-pointer"
        >
          {language === 'ar' ? 'مختلفان' : 'DIFFÉRENTS'}
        </button>
        <button
          onClick={() => handleResponse(true)}
          className="flex-1 h-20 bg-green-600/10 border-2 border-green-500/20 text-green-500 rounded-2xl font-black text-lg hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-md cursor-pointer"
        >
          {language === 'ar' ? 'متطابقان' : 'IDENTIQUES'}
        </button>
      </div>
    </div>
  );
}
