import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface MentalMapProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

interface Landmark {
  emoji: string;
  name: { ar: string; fr: string };
  color: string;
}

const LANDMARKS: Record<number, Landmark> = {
  0: { emoji: '🕌', name: { ar: 'مسجد', fr: 'Mosquée' }, color: 'from-emerald-950/40 to-emerald-900/10 border-emerald-500/30 text-emerald-400' },
  1: { emoji: '🌲', name: { ar: 'حديقة', fr: 'Jardin' }, color: 'from-green-950/40 to-green-900/10 border-green-500/30 text-green-400' },
  2: { emoji: '🏠', name: { ar: 'منزل', fr: 'Maison' }, color: 'from-blue-950/40 to-blue-900/10 border-blue-500/30 text-blue-400' },
  3: { emoji: '🏫', name: { ar: 'مدرسة', fr: 'École' }, color: 'from-violet-950/40 to-violet-900/10 border-violet-500/30 text-violet-400' },
  4: { emoji: '🏪', name: { ar: 'سوق', fr: 'Marché' }, color: 'from-amber-950/40 to-amber-900/10 border-amber-500/30 text-amber-400' },
  5: { emoji: '🏥', name: { ar: 'مستشفى', fr: 'Hôpital' }, color: 'from-rose-955/40 to-rose-900/10 border-rose-500/30 text-rose-400' },
  6: { emoji: '🏦', name: { ar: 'بنك', fr: 'Banque' }, color: 'from-cyan-950/40 to-cyan-900/10 border-cyan-500/30 text-cyan-400' },
  7: { emoji: '🏟️', name: { ar: 'ملعب', fr: 'Stade' }, color: 'from-orange-950/40 to-orange-900/10 border-orange-500/30 text-orange-400' },
  8: { emoji: '🏖️', name: { ar: 'شاطئ', fr: 'Plage' }, color: 'from-sky-950/40 to-sky-900/10 border-sky-500/30 text-sky-400' }
};

export default function MentalMap({ isTraining, onComplete, language }: MentalMapProps) {
  const gridSize = 3; // 3x3 grid
  const [path, setPath] = useState<number[]>([]);
  const [userPath, setUserPath] = useState<number[]>([]);
  const [phase, setPhase] = useState<'showing' | 'input' | 'feedback'>('showing');
  const [round, setRound] = useState(1);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [stats, setStats] = useState({ correctRounds: 0, totalErrors: 0, startTime: 0, totalTime: 0 });
  
  const maxRounds = isTraining ? 2 : 4;
  const pathLength = isTraining ? 3 : 4;

  useEffect(() => {
    generatePath();
  }, [round]);

  const generatePath = () => {
    const newPath: number[] = [];
    let current = Math.floor(Math.random() * 9);
    newPath.push(current);

    while (newPath.length < pathLength) {
      const neighbors = getNeighbors(current, gridSize);
      const possible = neighbors.filter(n => !newPath.includes(n));
      if (possible.length === 0) break;
      current = possible[Math.floor(Math.random() * possible.length)];
      newPath.push(current);
    }

    setPath(newPath);
    setUserPath([]);
    setPhase('showing');
    setActiveStepIndex(-1);

    // Sequence flashing logic
    let step = 0;
    const interval = setInterval(() => {
      if (step < newPath.length) {
        setActiveStepIndex(step);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setActiveStepIndex(-1);
          setPhase('input');
          setStats(s => ({ ...s, startTime: Date.now() }));
        }, 800);
      }
    }, 1200);
  };

  const getNeighbors = (index: number, size: number) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(index - size);
    if (row < size - 1) neighbors.push(index + size);
    if (col > 0) neighbors.push(index - 1);
    if (col < size - 1) neighbors.push(index + 1);
    return neighbors;
  };

  const handleCellClick = (index: number) => {
    if (phase !== 'input') return;
    
    const nextExpected = path[userPath.length];
    if (index === nextExpected) {
      const newPath = [...userPath, index];
      setUserPath(newPath);
      if (newPath.length === path.length) {
        handleRoundComplete(true);
      }
    } else {
      setStats(s => ({ ...s, totalErrors: s.totalErrors + 1 }));
      handleRoundComplete(false);
    }
  };

  const handleRoundComplete = (success: boolean) => {
    const timeTaken = Date.now() - stats.startTime;
    setStats(s => ({
      ...s,
      correctRounds: success ? s.correctRounds + 1 : s.correctRounds,
      totalTime: s.totalTime + timeTaken
    }));
    setPhase('feedback');
    
    setTimeout(() => {
      if (round < maxRounds) {
        setRound(r => r + 1);
      } else {
        finishTest();
      }
    }, 1500);
  };

  const finishTest = () => {
    onComplete({
      averageReactionTime: stats.correctRounds > 0 ? stats.totalTime / stats.correctRounds : 0,
      correctCount: stats.correctRounds,
      errorCount: stats.totalErrors,
      accuracy: stats.correctRounds / maxRounds
    }, []);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] max-w-xl mx-auto">
      <div className="mb-6 text-slate-400 font-mono text-[10px] uppercase tracking-widest w-full flex justify-between">
        <span>GEOGRAPHIC_MAP_MEMORY</span>
        <span>ROUND {round}/{maxRounds}</span>
      </div>

      <h3 className="text-xl font-black text-slate-900 px-4 leading-tight mb-2">
         {phase === 'showing' 
           ? (language === 'ar' ? 'تذكر مسار الخريطة بين المعالم' : 'Mémorisez l\'itinéraire entre les lieux')
           : (language === 'ar' ? 'أعد رسم المسار الجغرافي بالترتيب!' : 'Recréez le chemin dans l\'ordre !')}
      </h3>

      <p className="text-slate-600 text-xs px-6 mb-8">
         {phase === 'showing'
           ? (language === 'ar' ? 'راقب وميض المعالم بالترتيب...' : 'Regardez les lieux clignoter dans l\'ordre...')
           : (language === 'ar' ? 'اضغط على المعالم بالترتيب الصحيح' : 'Cliquez sur les lieux dans le bon ordre')}
      </p>

      <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner max-w-sm w-full aspect-square">
        {Array.from({ length: 9 }).map((_, i) => {
          const landmark = LANDMARKS[i];
          const isCurrentFlash = phase === 'showing' && activeStepIndex !== -1 && path[activeStepIndex] === i;
          const isUserClicked = userPath.includes(i);
          const userClickOrder = userPath.indexOf(i) + 1;
          const stepInPath = path.indexOf(i);

          // Build colors classes
          let statusBorder = 'border-slate-200 bg-white hover:border-slate-300';
          if (isCurrentFlash) {
            statusBorder = 'border-primary-500 bg-primary-50 shadow-md scale-105';
          } else if (isUserClicked) {
            statusBorder = 'border-green-500 bg-green-50 text-green-600 scale-105';
          }

          return (
            <motion.button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={phase !== 'input'}
              whileHover={phase === 'input' ? { scale: 1.05 } : {}}
              whileTap={phase === 'input' ? { scale: 0.95 } : {}}
              className={`relative rounded-3xl border-2 p-2 flex flex-col items-center justify-center transition-all cursor-pointer ${statusBorder}`}
            >
              <span className="text-3xl mb-1">{landmark.emoji}</span>
              <span className="text-[10px] font-bold text-slate-500 select-none">
                 {landmark.name[language]}
              </span>

              {/* Sequential Indicator badge */}
              {phase === 'showing' && isCurrentFlash && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                   {activeStepIndex + 1}
                </div>
              )}

              {phase === 'input' && isUserClicked && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-green-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                   {userClickOrder}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {phase === 'feedback' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl font-black ${userPath.length === path.length ? 'text-green-600' : 'text-red-500'}`}
            >
              {userPath.length === path.length 
                ? (language === 'ar' ? 'أداء رائع ومتطابق! ✓' : 'Félicitations ! ✓') 
                : (language === 'ar' ? 'فصل في المسار! ✗' : 'Inégal ! ✗')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
