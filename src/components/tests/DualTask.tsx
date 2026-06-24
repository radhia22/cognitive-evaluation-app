import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface DualTaskProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

export default function DualTask({ isTraining, onComplete, language }: DualTaskProps) {
  const maxRounds = isTraining ? 3 : 10;
  const [currentRound, setCurrentRound] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [stimulus, setStimulus] = useState<{ id: number; x: number; y: number; type: 'valid' | 'invalid' } | null>(null);
  const [stats, setStats] = useState({ correct: 0, errors: 0, totalReactionTime: 0, trackingError: 0 });
  const [startTime, setStartTime] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 50, y: 50 });
  const trackingInterval = useRef<any>(null);
  const stimulusTimer = useRef<any>(null);

  const startTest = () => {
    setIsStarted(true);
    setStartTime(Date.now());
    
    // Tracking behavior
    trackingInterval.current = setInterval(() => {
      setTargetPos(prev => {
        const dx = (Math.random() - 0.5) * 15;
        const dy = (Math.random() - 0.5) * 15;
        const newX = Math.min(Math.max(prev.x + dx, 10), 90);
        const newY = Math.min(Math.max(prev.y + dy, 10), 90);
        
        // Calculate tracking error
        const dist = Math.sqrt(Math.pow(newX - mousePos.current.x, 2) + Math.pow(newY - mousePos.current.y, 2));
        setStats(s => ({ ...s, trackingError: s.trackingError + dist }));
        
        return { x: newX, y: newY };
      });
    }, 100);

    spawnStimulus();
  };

  const spawnStimulus = () => {
    if (currentRound >= maxRounds) return;

    stimulusTimer.current = setTimeout(() => {
      setStimulus({
        id: Date.now(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        type: Math.random() > 0.3 ? 'valid' : 'invalid'
      });
      setStartTime(Date.now());
    }, Math.random() * 2000 + 1000);
  };

  const handleStimulusClick = (type: 'valid' | 'invalid') => {
    if (!stimulus) return;
    
    const reactionTime = Date.now() - startTime;
    if (type === 'valid') {
      setStats(s => ({ ...s, correct: s.correct + 1, totalReactionTime: s.totalReactionTime + reactionTime }));
    } else {
      setStats(s => ({ ...s, errors: s.errors + 1 }));
    }

    setStimulus(null);
    setCurrentRound(r => {
      const next = r + 1;
      if (next >= maxRounds) {
        finishTest();
      } else {
        spawnStimulus();
      }
      return next;
    });
  };

  const finishTest = () => {
    clearInterval(trackingInterval.current);
    clearTimeout(stimulusTimer.current);
    
    const finalMetrics: TestMetrics = {
      averageReactionTime: stats.correct > 0 ? stats.totalReactionTime / stats.correct : 0,
      correctCount: stats.correct,
      errorCount: stats.errors,
      accuracy: stats.correct / maxRounds
    };
    
    onComplete(finalMetrics, []);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    } else {
      x = ((e.clientX - rect.left) / rect.width) * 100;
      y = ((e.clientY - rect.top) / rect.height) * 100;
    }
    
    mousePos.current = { x, y };
  };

  useEffect(() => {
    return () => {
      clearInterval(trackingInterval.current);
      clearTimeout(stimulusTimer.current);
    };
  }, []);

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[40px] border border-slate-200 shadow-xl max-w-xl mx-auto min-h-[300px]">
        <button 
          onClick={startTest}
          className="px-10 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-[24px] font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto cursor-pointer text-sm uppercase tracking-wider"
        >
          {language === 'ar' ? 'بدء المهمة المزدوجة' : 'Démarrer la double tâche'}
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      className="relative w-full aspect-video bg-slate-50 rounded-[32px] border-4 border-slate-200 overflow-hidden cursor-none shadow-inner"
    >
      {/* Target to track */}
      <motion.div 
        animate={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
        transition={{ type: 'spring', damping: 10, stiffness: 50 }}
        className="absolute w-12 h-12 bg-primary-500/20 border-2 border-primary-500 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping" />
      </motion.div>

      {/* User Cursor */}
      <div 
        className="absolute w-8 h-8 border-2 border-slate-800 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
        style={{ left: `${mousePos.current.x}%`, top: `${mousePos.current.y}%` }}
      />

      {/* Stimuli */}
      <AnimatePresence>
        {stimulus && (
          <motion.button
            key={stimulus.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            onClick={() => handleStimulusClick(stimulus.type)}
            className={`absolute w-16 h-16 rounded-2xl flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-30 shadow-md transition-transform active:scale-90 ${
              stimulus.type === 'valid' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ left: `${stimulus.x}%`, top: `${stimulus.y}%` }}
          >
             {stimulus.type === 'valid' ? '✅' : '❌'}
          </motion.button>
        )}
      </AnimatePresence>

      <div className="absolute top-6 left-6 flex gap-4">
         <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold text-slate-700 border border-slate-100 shadow-sm">
            ROUND: {currentRound + 1}/{maxRounds}
         </div>
      </div>
    </div>
  );
}
