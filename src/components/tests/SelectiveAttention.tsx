import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface Props {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

const words = {
  ar: ['السبت', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'الأحد'],
  fr: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
};

export default function SelectiveAttention({ isTraining, onComplete, language }: Props) {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [trialCount, setTrialCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  const targetWord = language === 'ar' ? 'الأحد' : 'Dimanche';
  const responded = useRef<boolean>(false);
  const timeoutRef = useRef<any>(null);
  const startTime = useRef<number>(0);
  const totalTrials = isTraining ? 10 : 20;

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'fr-FR';
    window.speechSynthesis.speak(utterance);
  };

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
    const wordList = words[language];
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    
    setCurrentWord(newWord);
    speak(newWord);
    startTime.current = Date.now();
    setTrialCount(prev => prev + 1);

    timeoutRef.current = setTimeout(() => {
      // If target but no response
      if (newWord === targetWord && !responded.current) {
        setErrorCount(prev => prev + 1);
        setFeedback('wrong');
      } 
      // If not target and no response (correct)
      else if (newWord !== targetWord && !responded.current) {
        setCorrectCount(prev => prev + 1);
        // setFeedback('correct'); // Shoudln't show feedback for non-press if correct
      }
      
      setTimeout(nextTrial, 1000);
    }, 2000);
  }, [trialCount, totalTrials, language, onComplete, reactionTimes, correctCount, errorCount, targetWord]);

  useEffect(() => {
    nextTrial();
    return () => {
      clearTimeout(timeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePress = () => {
    if (responded.current) return;
    responded.current = true;
    const rt = Date.now() - startTime.current;

    if (currentWord === targetWord) {
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
      <div className="absolute top-8 text-xs font-mono tracking-wider font-bold text-slate-400 font-bold">
        ROUND {trialCount} / {totalTrials}
      </div>

      <div className="text-6xl font-black text-primary-600 mb-2 mt-4 h-20">
        <motion.div
          key={currentWord}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {currentWord}
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
        {language === 'ar' ? 'الآن!' : 'MAINTENANT !'}
      </button>
      
      <p className="text-slate-500 font-medium text-xs text-center max-w-xs leading-relaxed">
        {language === 'ar' ? 'اضغط فقط عند سماع أو رؤية يوم "الأحد"' : 'Appuyez seulement en entendant ou en voyant le jour "Dimanche"'}
      </p>
    </div>
  );
}
