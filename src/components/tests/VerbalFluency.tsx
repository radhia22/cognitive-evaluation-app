import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface VerbalFluencyProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

const LETTERS = {
  ar: ['أ', 'ب', 'ت', 'ج'],
  fr: ['F', 'A', 'S', 'R']
};

export default function VerbalFluency({ isTraining, onComplete, language }: VerbalFluencyProps) {
  const [currentLetter, setCurrentLetter] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(isTraining ? 15 : 60);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef<any>(null);

  const startTest = () => {
    const letters = LETTERS[language];
    setCurrentLetter(letters[Math.floor(Math.random() * letters.length)]);
    setIsStarted(true);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const word = inputValue.trim().toLowerCase();
      if (!words.includes(word) && word.startsWith(currentLetter.toLowerCase())) {
        setWords(prev => [word, ...prev]);
        setInputValue('');
      } else {
        // Simple shake animation or sound?
        setInputValue('');
      }
    }
  };

  useEffect(() => {
    if (isFinished) {
      onComplete({
        averageReactionTime: 0,
        correctCount: words.length,
        errorCount: 0,
        accuracy: words.length > 5 ? 1 : words.length / 5
      }, words);
    }
    return () => clearInterval(timerRef.current);
  }, [isFinished]);

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[40px] border border-slate-200 shadow-xl max-w-xl mx-auto min-h-[300px]">
        <h2 className="text-xl font-bold mb-6 text-slate-800 leading-relaxed">
          {language === 'ar' 
            ? `اكتب أكبر عدد ممكن من الكلمات التي تبدأ بالشرط المطلوب في ${timeLeft} ثانية.` 
            : `Écrivez autant de mots que possible commençant par la lettre demandée en ${timeLeft} secondes.`}
        </h2>
        <button 
          onClick={startTest}
          className="px-10 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-3xl font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm"
        >
          {language === 'ar' ? 'بدء الاختبار' : 'Démarrer le test'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-[40px] shadow-xl max-w-xl mx-auto min-h-[500px]">
      <div className="w-full flex justify-between items-center mb-10">
        <div className="w-20 h-20 bg-primary-50 border-2 border-primary-500 rounded-3xl text-4xl font-black text-primary-600 flex items-center justify-center shadow-sm">
          {currentLetter}
        </div>
        <div className={`text-3xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse animate-bounce' : 'text-slate-400'}`}>
          {timeLeft}s
        </div>
      </div>

      <input
        autoFocus
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={language === 'ar' ? 'اكتب كلمة واضغط Enter...' : 'Tapez un mot et appuyez sur Enter...'}
        className="w-full h-20 bg-slate-50 border-4 border-slate-200 rounded-[2rem] px-8 text-2xl font-bold text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 shadow-inner"
      />

      <div className="mt-10 w-full grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[160px] p-1">
        <AnimatePresence>
          {words.map((word, i) => (
            <motion.div
              key={word}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold text-center text-sm shadow-sm"
            >
              {word}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
        {words.length} {language === 'ar' ? 'كلمات تم تسجيلها' : 'mots enregistrés'}
      </div>
    </div>
  );
}
