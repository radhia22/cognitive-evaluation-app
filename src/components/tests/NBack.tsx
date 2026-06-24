import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface Props {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

export default function NBack({ isTraining, onComplete, language }: Props) {
  const n = 2;
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentLetter, setCurrentLetter] = useState<string>('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [trialCount, setTrialCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const responded = useRef<boolean>(false);
  const timeoutRef = useRef<any>(null);
  const startTime = useRef<number>(0);
  const totalTrials = isTraining ? 10 : 25;

  const nextTrial = useCallback(() => {
    if (trialCount >= totalTrials) {
      const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
      onComplete({
        averageReactionTime: avgRT,
        errorCount,
        correctCount,
        accuracy: correctCount / totalTrials
      }, []);
      return;
    }

    setFeedback('none');
    responded.current = false;
    
    // N-Back logic: Force a match occasionally
    let newLetter;
    if (sequence.length >= n && Math.random() < 0.3) {
      newLetter = sequence[sequence.length - n];
    } else {
      newLetter = letters[Math.floor(Math.random() * letters.length)];
    }

    setCurrentLetter(newLetter);
    setSequence(prev => [...prev, newLetter]);
    startTime.current = Date.now();
    setTrialCount(prev => prev + 1);

    timeoutRef.current = setTimeout(() => {
      // If was a match but didn't respond
      const isMatch = sequence.length >= n && newLetter === sequence[sequence.length - n];
      if (isMatch && !responded.current) {
        setErrorCount(prev => prev + 1);
        setFeedback('wrong');
      } else if (!isMatch && !responded.current) {
        setCorrectCount(prev => prev + 1);
      }

      setTimeout(nextTrial, 800);
    }, 2000);
  }, [trialCount, totalTrials, sequence, n, onComplete, reactionTimes, correctCount, errorCount, letters]);

  useEffect(() => {
    nextTrial();
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handlePress = () => {
    if (responded.current || sequence.length < n) return;
    responded.current = true;
    const rt = Date.now() - startTime.current;

    const isMatch = sequence.length >= n && currentLetter === sequence[sequence.length - n];
    if (isMatch) {
      setCorrectCount(prev => prev + 1);
      setReactionTimes(prev => [...prev, rt]);
      setFeedback('correct');
    } else {
      setErrorCount(prev => prev + 1);
      setFeedback('wrong');
    }

    clearTimeout(timeoutRef.current);
    setTimeout(nextTrial, 500);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 bg-white rounded-[40px] border border-slate-200 shadow-xl relative max-w-xl mx-auto min-h-[500px]">
      <div className="absolute top-8 text-xs font-mono tracking-wider font-bold text-slate-400">
        ROUND {trialCount} / {totalTrials}
      </div>

      <div className="text-8xl font-black text-slate-900 mb-2 mt-4 h-24">
        <motion.div
          key={sequence.length}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {currentLetter}
        </motion.div>
      </div>

      <div className="h-10 flex items-center">
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-green-600 font-black text-4xl">
               ✔
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-red-500 font-black text-4xl">
               ✖
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={handlePress}
        className="w-full max-w-sm h-20 bg-primary-600 hover:bg-primary-700 text-white rounded-3xl text-2xl font-black shadow-md active:scale-95 transition-all cursor-pointer"
      >
        {language === 'ar' ? 'تطابق!' : 'MATCH !'}
      </button>
      
      <p className="text-slate-500 font-medium text-xs text-center max-w-xs leading-relaxed">
        {language === 'ar' ? 'اضغط إذا كان الحرف هو نفسه ما قبل الخطوة السابقة (N=2)' : 'Appuyez si la lettre est la même qu\'il y a deux positions (N=2)'}
      </p>
    </div>
  );
}
