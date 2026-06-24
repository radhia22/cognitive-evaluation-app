import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface PhonologicalSimilarityProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

interface SoundPair {
  word1: string;
  word2: string;
  isSimilar: boolean;
}

const WORD_PAIRS = {
  ar: [
    { word1: 'دار', word2: 'نار', isSimilar: true },
    { word1: 'كتاب', word2: 'حساب', isSimilar: true },
    { word1: 'بحر', word2: 'سفر', isSimilar: false },
    { word1: 'جدار', word2: 'شباك', isSimilar: false },
    { word1: 'بار', word2: 'جار', isSimilar: true },
    { word1: 'شمس', word2: 'خمس', isSimilar: true },
    { word1: 'قلم', word2: 'علم', isSimilar: true },
    { word1: 'سماء', word2: 'صحراء', isSimilar: false },
    { word1: 'موز', word2: 'لوز', isSimilar: true },
    { word1: 'بيت', word2: 'زيت', isSimilar: true },
    { word1: 'صوت', word2: 'حوت', isSimilar: true },
    { word1: 'تفاح', word2: 'مصباح', isSimilar: true }
  ],
  fr: [
    { word1: 'Pain', word2: 'Bain', isSimilar: true },
    { word1: 'Livre', word2: 'Ciel', isSimilar: false },
    { word1: 'Soleil', word2: 'Sommeil', isSimilar: true },
    { word1: 'Train', word2: 'Main', isSimilar: true },
    { word1: 'Robe', word2: 'Bol', isSimilar: false },
    { word1: 'Chapeau', word2: 'Crapaud', isSimilar: true },
    { word1: 'Plage', word2: 'Cage', isSimilar: true },
    { word1: 'Vache', word2: 'Poche', isSimilar: false },
    { word1: 'Nuit', word2: 'Pluie', isSimilar: true },
    { word1: 'Fleur', word2: 'Peur', isSimilar: true }
  ]
};

export default function PhonologicalSimilarity({ isTraining, onComplete, language }: PhonologicalSimilarityProps) {
  const pairs = WORD_PAIRS[language] || WORD_PAIRS['fr'];
  const [currentPair, setCurrentPair] = useState<SoundPair | null>(null);
  const [round, setRound] = useState(0);
  const [stats, setStats] = useState({ correct: 0, errors: 0, totalTime: 0 });
  const [startTime, setStartTime] = useState(0);
  const maxRounds = isTraining ? 4 : 10;

  useEffect(() => {
    startTrial();
  }, [round]);

  const startTrial = () => {
    if (round >= maxRounds) {
      onComplete({
        averageReactionTime: stats.correct > 0 ? stats.totalTime / stats.correct : 0,
        correctCount: stats.correct,
        errorCount: stats.errors,
        accuracy: stats.correct / maxRounds
      }, []);
      return;
    }

    // Pick a random pair from the pool
    const idx = Math.floor(Math.random() * pairs.length);
    setCurrentPair(pairs[idx]);
    setStartTime(Date.now());
  };

  const handleResponse = (userChoice: boolean) => {
    if (!currentPair) return;
    const reactionTime = Date.now() - startTime;
    const correct = userChoice === currentPair.isSimilar;

    setStats(s => ({
      ...s,
      correct: correct ? s.correct + 1 : s.correct,
      errors: correct ? s.errors : s.errors + 1,
      totalTime: s.totalTime + reactionTime
    }));

    setRound(prev => prev + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[500px] bg-white rounded-[40px] border border-slate-200 shadow-xl text-center max-w-xl mx-auto">
      <div className="text-slate-400 font-mono text-[10px] uppercase tracking-widest mb-10 w-full flex justify-between">
         <span>PHONOLOGICAL MATCHING</span>
         <span>ROUND {round + 1} / {maxRounds}</span>
      </div>

      <h3 className="text-xl font-black text-slate-900 px-4 leading-tight">
        {language === 'ar' ? 'هل الكلمتان تتشابهان في النطق أو الصوت؟' : 'Les deux mots riment-ils / sonnent-ils de manière similaire ?'}
      </h3>
      
      <p className="text-slate-500 text-xs mt-2 mb-12">
        {language === 'ar' ? 'مثال على تشابه مسموع: دار - نار' : 'Exemple de rime : Pain - Bain'}
      </p>

      {currentPair && (
        <div className="flex justify-center items-center gap-6 sm:gap-12 mb-16 w-full">
          <motion.div
            key={`w1-${round}`}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 py-8 bg-slate-50 border-2 border-slate-200 rounded-3xl text-3xl font-black text-primary-600 shadow-sm"
          >
            {currentPair.word1}
          </motion.div>
          <div className="text-slate-400 font-bold text-lg select-none">&</div>
          <motion.div
            key={`w2-${round}`}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 py-8 bg-slate-50 border-2 border-slate-200 rounded-3xl text-3xl font-black text-primary-600 shadow-sm"
          >
            {currentPair.word2}
          </motion.div>
        </div>
      )}

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={() => handleResponse(false)}
          className="flex-1 h-20 bg-red-600/10 border-2 border-red-500/20 text-red-500 rounded-2xl font-black text-lg hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-md"
        >
          {language === 'ar' ? 'لا تتشابهان' : 'NON'}
        </button>
        <button
          onClick={() => handleResponse(true)}
          className="flex-1 h-20 bg-green-600/10 border-2 border-green-500/20 text-green-500 rounded-2xl font-black text-lg hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-md"
        >
          {language === 'ar' ? 'تتشابهان' : 'OUI'}
        </button>
      </div>
    </div>
  );
}
