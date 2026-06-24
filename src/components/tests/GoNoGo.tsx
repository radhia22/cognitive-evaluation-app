import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface Props {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

export default function GoNoGo({ isTraining, onComplete, language }: Props) {
  const [stimulus, setStimulus] = useState<'none' | 'go' | 'nogo'>('none');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [trialCount, setTrialCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  const lastStimulusTime = useRef<number>(0);
  const responded = useRef<boolean>(false);
  const stimulusTimeout = useRef<any>(null);
  const totalTrials = isTraining ? 10 : 30;

  const startTrial = useCallback(() => {
    setStimulus('none');
    setFeedback('none');
    responded.current = false;

    if (trialCount >= totalTrials) {
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      onComplete({
        averageReactionTime: avgRT,
        errorCount,
        correctCount,
        accuracy: correctCount / totalTrials
      }, []);
      return;
    }

    // Delay before stimulus
    const delay = 1000 + Math.random() * 2000;
    stimulusTimeout.current = setTimeout(() => {
      const isGo = Math.random() > 0.3;
      setStimulus(isGo ? 'go' : 'nogo');
      lastStimulusTime.current = Date.now();
      setTrialCount(prev => prev + 1);

      // Stimulus visibility duration
      stimulusTimeout.current = setTimeout(() => {
        if (!responded.current) {
          if (isGo) {
            setErrorCount(prev => prev + 1); // Omission error
            setFeedback('wrong');
          } else {
            setCorrectCount(prev => prev + 1); // Correctly withheld
            setFeedback('correct');
          }
        }
        setTimeout(startTrial, 500);
      }, 1000);
    }, delay);
  }, [trialCount, totalTrials, onComplete, reactionTimes, correctCount, errorCount]);

  useEffect(() => {
    startTrial();
    return () => clearTimeout(stimulusTimeout.current);
  }, []);

  const handlePress = () => {
    if (responded.current || stimulus === 'none') return;
    responded.current = true;
    const rt = Date.now() - lastStimulusTime.current;

    if (stimulus === 'go') {
      setCorrectCount(prev => prev + 1);
      setReactionTimes(prev => [...prev, rt]);
      setFeedback('correct');
    } else {
      setErrorCount(prev => prev + 1); // Commission error
      setFeedback('wrong');
    }

    clearTimeout(stimulusTimeout.current);
    setTimeout(startTrial, 1000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-12 p-10 bg-white rounded-[48px] border border-slate-200 shadow-xl relative overflow-hidden">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500 tracking-widest uppercase">
        Progression: {trialCount} / {totalTrials}
      </div>

      <div className="relative">
        <motion.div
          className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
            stimulus === 'go' ? 'bg-primary-500 shadow-lg' : 
            stimulus === 'nogo' ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-slate-100 border-4 border-slate-200'
          }`}
          animate={{ 
            scale: stimulus !== 'none' ? [1, 1.15, 1] : 1,
          }}
        >
          {stimulus !== 'none' && (
            <div className="w-56 h-56 rounded-full border-4 border-white/20 flex items-center justify-center">
              <span className="text-white text-5xl font-black uppercase tracking-tighter">
                {stimulus === 'go' ? 'Go' : 'Stop'}
              </span>
            </div>
          )}
        </motion.div>
        
        {/* Particle / Aura effect */}
        <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-500 ${
          stimulus === 'go' ? 'bg-primary-600/10 opacity-100' : 
          stimulus === 'nogo' ? 'bg-red-600/10 opacity-100' : 'opacity-0'
        }`}></div>
      </div>

      <div className="h-24 flex items-center">
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="text-green-500 font-bold text-5xl flex items-center gap-2">
               <div className="w-12 h-12 rounded-full border-4 border-green-500/50 flex items-center justify-center">
                 <span className="text-center leading-none">✔</span>
               </div>
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="text-red-500 font-bold text-5xl flex items-center gap-2">
               <div className="w-12 h-12 rounded-full border-4 border-red-500/50 flex items-center justify-center">
                 <span className="text-center leading-none">✖</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="w-full max-w-lg">
        <button
          onPointerDown={handlePress}
          className="w-full h-32 bg-slate-100 hover:bg-slate-200 active:bg-primary-600 active:text-white border-2 border-slate-200 text-slate-800 rounded-[40px] text-4xl font-black shadow-md transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity"></div>
          <span className="relative z-10 tracking-widest">
            {language === 'ar' ? 'اضغط!' : 'APPUYEZ !'}
          </span>
        </button>
        <p className="text-center mt-6 text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
          Central Executive Monitoring Active
        </p>
      </footer>
    </div>
  );
}
