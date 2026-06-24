import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface ReverseDirectionProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

type Direction = 'up' | 'down' | 'left' | 'right';

export default function ReverseDirection({ isTraining, onComplete, language }: ReverseDirectionProps) {
  const [currentDir, setCurrentDir] = useState<Direction | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [stats, setStats] = useState({ correct: 0, errors: 0, totalTime: 0 });
  const [startTime, setStartTime] = useState(0);
  const [phase, setPhase] = useState<'showing' | 'waiting'>('waiting');

  const maxRounds = isTraining ? 4 : 15;
  const directions: Direction[] = ['up', 'down', 'left', 'right'];

  useEffect(() => {
    nextRound();
  }, []);

  const nextRound = () => {
    setPhase('waiting');
    setTimeout(() => {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      setCurrentDir(dir);
      setStartTime(Date.now());
      setPhase('showing');
    }, Math.random() * 1000 + 1000);
  };

  const handleResponse = (response: Direction) => {
    if (phase !== 'showing' || !currentDir) return;
    
    const reactionTime = Date.now() - startTime;
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };

    if (response === opposites[currentDir]) {
      setStats(s => ({ ...s, correct: s.correct + 1, totalTime: s.totalTime + reactionTime }));
    } else {
      setStats(s => ({ ...s, errors: s.errors + 1 }));
    }

    if (currentRound + 1 >= maxRounds) {
      onComplete({
        averageReactionTime: stats.correct > 0 ? stats.totalTime / stats.correct : 0,
        correctCount: stats.correct,
        errorCount: stats.errors,
        accuracy: stats.correct / maxRounds
      }, []);
    } else {
      setCurrentRound(prev => prev + 1);
      nextRound();
    }
  };

  const renderIcon = (dir: Direction) => {
    const props = { size: 120, className: "text-primary-500" };
    switch (dir) {
      case 'up': return <ArrowUp {...props} />;
      case 'down': return <ArrowDown {...props} />;
      case 'left': return <ArrowLeft {...props} />;
      case 'right': return <ArrowRight {...props} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl max-w-xl mx-auto min-h-[500px]">
      <div className="mb-10 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {language === 'ar' ? 'اضغط في الاتجاه المعاكس للسهم!' : 'Appuyez dans la direction opposée à la flèche !'}
        </h2>
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
           INHIBITION_LEVEL: {currentRound + 1} / {maxRounds}
        </div>
      </div>

      <div className="h-64 flex items-center justify-center mb-10 w-full">
        <AnimatePresence mode="wait">
          {phase === 'showing' && currentDir && (
            <motion.div
              key={currentDir}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="p-12 bg-slate-50 rounded-[3rem] border-4 border-slate-200 shadow-md"
            >
              {renderIcon(currentDir)}
            </motion.div>
          )}
          {phase === 'waiting' && <div className="text-4xl text-slate-300 font-black">+</div>}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        <div />
        <button onClick={() => handleResponse('up')} className="h-20 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all active:scale-90 shadow-sm">
           <ArrowUp size={32} />
        </button>
        <div />
        
        <button onClick={() => handleResponse('left')} className="h-20 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all active:scale-90 shadow-sm">
           <ArrowLeft size={32} />
        </button>
        <div className="bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-mono font-bold">OPPOSITE</div>
        <button onClick={() => handleResponse('right')} className="h-20 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all active:scale-90 shadow-sm">
           <ArrowRight size={32} />
        </button>
        
        <div />
        <button onClick={() => handleResponse('down')} className="h-20 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all active:scale-90 shadow-sm">
           <ArrowDown size={32} />
        </button>
        <div />
      </div>
    </div>
  );
}
