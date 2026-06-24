import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface Props {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

interface StroopOption {
  text: string;
  color: string;
  id: string;
}

const COLOR_MAP: Record<string, { ar: string; fr: string; class: string }> = {
  red: { ar: 'أحمر', fr: 'Rouge', class: 'text-red-500' },
  blue: { ar: 'أزرق', fr: 'Bleu', class: 'text-blue-500' },
  green: { ar: 'أخضر', fr: 'Vert', class: 'text-green-500' },
  yellow: { ar: 'أصفر', fr: 'Jaune', class: 'text-yellow-400' }
};

const COLORS = ['red', 'blue', 'green', 'yellow'];

export default function StroopTest({ isTraining, onComplete, language }: Props) {
  const [currentTrial, setCurrentTrial] = useState<StroopOption | null>(null);
  const [trialCount, setTrialCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  
  const totalTrials = isTraining ? 5 : 15;
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    generateTrial();
  }, [trialCount]);

  const generateTrial = () => {
    if (trialCount >= totalTrials) {
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      onComplete({
        averageReactionTime: avgRT,
        correctCount,
        errorCount,
        accuracy: correctCount / totalTrials
      }, []);
      return;
    }

    setFeedback('none');
    
    // Choose conflicting word and text ink color
    const wordKey = COLORS[Math.floor(Math.random() * COLORS.length)];
    let colorKey = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // In Stroop test, we need high conflict rate (e.g., 80% conflicting, 20% consistent)
    if (Math.random() > 0.2 && wordKey === colorKey) {
      colorKey = COLORS.find(c => c !== wordKey) || colorKey;
    }

    const testWord = COLOR_MAP[wordKey][language];

    setCurrentTrial({
      text: testWord,
      color: colorKey,
      id: `${Date.now()}-${trialCount}`
    });

    setStartTime(Date.now());
  };

  const handleChoice = (selectedColor: string) => {
    if (!currentTrial || feedback !== 'none') return;
    
    const reactionTime = Date.now() - startTime;
    const isCorrect = selectedColor === currentTrial.color;

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      setReactionTimes(prev => [...prev, reactionTime]);
      setFeedback('correct');
    } else {
      setErrorCount(e => e + 1);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setTrialCount(prev => prev + 1);
    }, 700);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] text-center max-w-xl mx-auto">
      <div className="w-full flex justify-between text-slate-400 font-mono text-[10px] uppercase tracking-widest mb-8">
        <div>ROUND: {trialCount + 1} / {totalTrials}</div>
        <div>ACCURACY: {trialCount > 0 ? Math.round((correctCount / trialCount) * 100) : 100}%</div>
      </div>

      <h3 className="text-sm font-black text-slate-600 mb-6 px-6">
        {language === 'ar' 
          ? 'تنبيه: اختر لون الخط (الحبر) وليس الكلمة المكتوبة!' 
          : 'Attention: Choisissez la couleur de l\'encre (la police), pas la signification du mot !'}
      </h3>

      <div className="h-44 flex items-center justify-center relative w-full">
        <AnimatePresence mode="wait">
          {feedback === 'none' && currentTrial && (
            <motion.div
              key={currentTrial.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              className={`text-6xl font-black select-none tracking-wide`}
              style={{ color: currentTrial.color === 'yellow' ? '#b45309' : currentTrial.color === 'red' ? '#dc2626' : currentTrial.color === 'blue' ? '#2563eb' : '#16a34a' }}
            >
              {currentTrial.text}
            </motion.div>
          )}

          {feedback === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-600 text-6xl font-black">
               ✓
            </motion.div>
          )}

          {feedback === 'wrong' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500 text-6xl font-black">
               ✗
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-12">
        {COLORS.map(colorKey => {
          const trans = COLOR_MAP[colorKey][language];
          const bgColors: Record<string, string> = {
            red: 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/30',
            blue: 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30',
            green: 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/30',
            yellow: 'bg-amber-500 hover:bg-amber-400 hover:shadow-amber-400/30 text-slate-900 border border-amber-600/10'
          };
          
          return (
            <motion.button
              key={colorKey}
              onClick={() => handleChoice(colorKey)}
              disabled={feedback !== 'none'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`py-5 rounded-2xl ${bgColors[colorKey]} font-black text-white text-base shadow-md transition-all uppercase tracking-widest disabled:opacity-50 cursor-pointer`}
            >
              {trans}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
