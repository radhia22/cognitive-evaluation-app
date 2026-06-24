import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface DigitSpanProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

export default function DigitSpan({ isTraining, onComplete, language }: DigitSpanProps) {
  const [digits, setDigits] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [spanLength, setSpanLength] = useState(3);
  const [phase, setPhase] = useState<'display' | 'input' | 'feedback'>('display');
  const [displayIndex, setDisplayIndex] = useState(-1);
  const [round, setRound] = useState(1);
  const [isReverseMode, setIsReverseMode] = useState(false); // Alternates forward & reverse!
  
  const maxRounds = isTraining ? 3 : 6;
  
  const [stats, setStats] = useState({
    correct: 0,
    errors: 0,
    totalTime: 0,
    startTime: 0
  });

  const speakDigit = (digit: number) => {
    const utterance = new SpeechSynthesisUtterance(digit.toString());
    utterance.lang = language === 'ar' ? 'ar-SA' : 'fr-FR';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const startRound = useCallback(() => {
    const newDigits = Array.from({ length: spanLength }, () => Math.floor(Math.random() * 10));
    setDigits(newDigits);
    setUserInput('');
    setPhase('display');
    setDisplayIndex(-1);

    // Alternate modes: odd rounds forward, even rounds reverse
    setIsReverseMode(round % 2 === 0);
    
    // Sequence display logic with speech
    let current = 0;
    setTimeout(() => {
      setDisplayIndex(0);
      speakDigit(newDigits[0]);
      
      const interval = setInterval(() => {
        current++;
        if (current < newDigits.length) {
          setDisplayIndex(current);
          speakDigit(newDigits[current]);
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setPhase('input');
            setDisplayIndex(-1);
            setStats(s => ({ ...s, startTime: Date.now() }));
          }, 1100);
        }
      }, 1300);
    }, 500);
  }, [spanLength, round, language]);

  useEffect(() => {
    startRound();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [round]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'input') return;

    // Direct (forward) vs Reverse check
    const expected = isReverseMode 
      ? [...digits].reverse().join('') 
      : digits.join('');
      
    const success = userInput.trim() === expected;
    const timeTaken = Date.now() - stats.startTime;

    setStats(s => ({
      ...s,
      correct: success ? s.correct + 1 : s.correct,
      errors: success ? s.errors : s.errors + 1,
      totalTime: s.totalTime + timeTaken
    }));

    setPhase('feedback');

    setTimeout(() => {
      if (round < maxRounds) {
        if (success) {
          setSpanLength(s => s + 1);
        } else {
          setSpanLength(s => Math.max(3, s - 1));
        }
        setRound(r => r + 1);
      } else {
        const finalAccuracy = (stats.correct + (success ? 1 : 0)) / maxRounds;
        onComplete({
          averageReactionTime: stats.correct > 0 ? stats.totalTime / maxRounds : timeTaken,
          correctCount: stats.correct + (success ? 1 : 0),
          errorCount: stats.errors + (success ? 0 : 1),
          accuracy: finalAccuracy
        }, []);
      }
    }, 1800);
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] text-center max-w-xl mx-auto">
      <div className="mb-8 flex justify-between w-full text-slate-400 font-mono text-[10px] uppercase tracking-widest px-4">
         <div>ROUND: {round}/{maxRounds}</div>
         <div className="text-primary-600 font-bold">
            {isReverseMode 
              ? (language === 'ar' ? 'وضع الترتيب العكسي 🔄' : 'MODE INVERSÉ 🔄') 
              : (language === 'ar' ? 'وضع الترتيب المباشر ➡️' : 'MODE DIRECT ➡️')}
         </div>
         <div>SPAN: {spanLength} DIGITS</div>
      </div>

      <h3 className="text-xl font-bold mb-4 text-slate-900">
        {phase === 'display' 
          ? (language === 'ar' ? 'استمع للأرقام واحفظها' : 'Écoutez les chiffres et mémorisez ronds')
          : isReverseMode
            ? (language === 'ar' ? 'اكتب الأرقام التي سمعتها بالترتيب العكسي!' : 'Entrez les chiffres entendus à l\'envers !')
            : (language === 'ar' ? 'اكتب الأرقام التي سمعتها بنفس الترتيب الدقيق!' : 'Entrez les chiffres dans le même ordre !')}
      </h3>

      <div className="h-44 flex items-center justify-center relative w-full">
        <AnimatePresence mode="wait">
          {phase === 'display' && displayIndex !== -1 && (
            <motion.div
              key={`${displayIndex}-${digits[displayIndex]}`}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-8xl font-black text-primary-600 select-none"
            >
              {digits[displayIndex]}
            </motion.div>
          )}

          {phase === 'input' && (
            <motion.form 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-6 w-full"
            >
              <input
                autoFocus
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                value={userInput}
                onChange={e => setUserInput(e.target.value.replace(/\D/g, ''))}
                className="w-full max-w-xs h-20 bg-slate-50 border-2 border-slate-200 rounded-3xl text-5xl font-black text-slate-800 text-center focus:bg-white focus:border-primary-500 outline-none transition-all shadow-inner"
              />
              <button 
                type="submit"
                className="px-10 h-14 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all uppercase tracking-widest text-xs active:scale-95 shadow-md"
              >
                {language === 'ar' ? 'تأكيد الإجابة' : 'Confirmer'}
              </button>
            </motion.form>
          )}

          {phase === 'feedback' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-8xl font-black ${userInput === (isReverseMode ? [...digits].reverse().join('') : digits.join('')) ? 'text-green-500' : 'text-red-500'}`}
            >
              {userInput === (isReverseMode ? [...digits].reverse().join('') : digits.join('')) ? '✓' : '✗'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'feedback' && (
        <div className="mt-8 text-slate-400 font-mono text-xs uppercase tracking-widest">
           {language === 'ar' ? 'الترتيب المطلوب: ' : 'Attendu : '} 
           <span className="text-slate-800 font-bold ml-1">
             {isReverseMode ? [...digits].reverse().join(' ') : digits.join(' ')}
           </span>
        </div>
      )}
    </div>
  );
}
