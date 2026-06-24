import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';
import { Package, Inbox, Briefcase } from 'lucide-react';

interface Props {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

type ParcelType = {
  kind: 'box' | 'envelope' | 'bag';
  color: 'red' | 'blue' | 'yellow';
};

const COLOR_NAMES = {
  red: { ar: 'أحمر', fr: 'Rouge' },
  blue: { ar: 'أزرق', fr: 'Bleu' },
  yellow: { ar: 'أصفر', fr: 'Jaune' }
};

const KIND_NAMES = {
  box: { ar: 'صندوق 📦', fr: 'Carton 📦' },
  envelope: { ar: 'ظرف ✉️', fr: 'Enveloppe ✉️' },
  bag: { ar: 'حقيبة 🛍️', fr: 'Sac 🛍️' }
};

export default function TaskSwitching({ isTraining, onComplete, language }: Props) {
  const [currentParcel, setCurrentParcel] = useState<ParcelType | null>(null);
  const [rule, setRule] = useState<'color' | 'kind'>('color');
  const [trialCount, setTrialCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [difficultyLevel, setDifficultyLevel] = useState(1); // Escalates difficulty
  
  const startTime = useRef<number>(0);
  const responded = useRef<boolean>(false);
  const totalTrials = isTraining ? 6 : 16;

  const generateParcel = () => {
    const kinds: ParcelType['kind'][] = difficultyLevel === 1 ? ['box', 'envelope'] : ['box', 'envelope', 'bag'];
    const colors: ParcelType['color'][] = difficultyLevel === 1 ? ['blue', 'red'] : ['blue', 'red', 'yellow'];
    
    return {
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    };
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
    setCurrentParcel(generateParcel());
    
    // Periodically shift the sorting rule after every 4 trials to test cognitive control
    if (trialCount > 0 && trialCount % 4 === 0) {
      setRule(prev => (prev === 'color' ? 'kind' : 'color'));
    }

    // Escalate difficulty gradually
    if (trialCount === Math.floor(totalTrials / 3)) {
      setDifficultyLevel(2);
    } else if (trialCount === Math.floor((totalTrials * 2) / 3)) {
      setDifficultyLevel(3);
    }

    startTime.current = Date.now();
    setTrialCount(prev => prev + 1);
  }, [trialCount, totalTrials, difficultyLevel, onComplete, reactionTimes, correctCount, errorCount]);

  useEffect(() => {
    nextTrial();
  }, []);

  const handleChoice = (choice: string) => {
    if (responded.current || !currentParcel) return;
    responded.current = true;
    const rt = Date.now() - startTime.current;

    let isCorrect = false;
    if (rule === 'color') {
      isCorrect = currentParcel.color === choice;
    } else {
      isCorrect = currentParcel.kind === choice;
    }

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setReactionTimes(prev => [...prev, rt]);
      setFeedback('correct');
    } else {
      setErrorCount(prev => prev + 1);
      setFeedback('wrong');
    }

    setTimeout(nextTrial, 900);
  };

  const getParcelIcon = (kind: ParcelType['kind'], color: string) => {
    const fillColors = {
      red: '#ef4444',
      blue: '#3b82f6',
      yellow: '#eab308'
    };
    const fill = fillColors[color as keyof typeof fillColors] || '#fff';

    if (kind === 'box') return <Package size={80} style={{ color: fill }} strokeWidth={1.5} />;
    if (kind === 'envelope') return <Inbox size={80} style={{ color: fill }} strokeWidth={1.5} />;
    return <Briefcase size={80} style={{ color: fill }} strokeWidth={1.5} />;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] text-center max-w-xl mx-auto">
      <div className="w-full flex justify-between text-slate-400 font-mono text-[10px] uppercase tracking-widest mb-6">
        <div>PARCEL: {trialCount} / {totalTrials}</div>
        <div className="text-primary-600 font-bold">LEVEL {difficultyLevel}/3</div>
        <div>STABLE_SORTING</div>
      </div>

      <div className="text-center mb-6">
        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">
           {language === 'ar' ? 'اصنف الطرد حسب قاعدة:' : 'Trier le paquet selon la règle :'}
        </h4>
        <AnimatePresence mode="wait">
          <motion.div 
            key={rule}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            className={`inline-block px-8 py-2.5 rounded-3xl font-black text-xl uppercase tracking-widest shadow-sm ${
              rule === 'color' ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-violet-50 border border-violet-200 text-violet-700'
            }`}
          >
            {rule === 'color' 
              ? (language === 'ar' ? 'اللون 🎨' : 'COULEUR 🎨') 
              : (language === 'ar' ? 'نوع الطرد 📦' : 'TYPE DE PLI 📦')}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="h-44 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {feedback === 'none' && currentParcel && (
            <motion.div
              key={JSON.stringify(currentParcel)}
              initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
              animate={{ scale: 1.1, rotate: 0, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              className="p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-inner relative flex items-center justify-center"
            >
              {getParcelIcon(currentParcel.kind, currentParcel.color)}
            </motion.div>
          )}

          {feedback === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-600 font-black text-6xl">
               ✔
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500 font-black text-6xl">
               ✖
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-6"></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md mt-6">
        {rule === 'color' ? (
          <>
            <button
              onClick={() => handleChoice('blue')}
              className="py-5 bg-blue-50 border-2 border-blue-200 text-blue-600 font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all text-xs uppercase cursor-pointer shadow-sm"
            >
              {COLOR_NAMES.blue[language]}
            </button>
            <button
              onClick={() => handleChoice('red')}
              className="py-5 bg-red-50 border-2 border-red-200 text-red-600 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all text-xs uppercase cursor-pointer shadow-sm"
            >
              {COLOR_NAMES.red[language]}
            </button>
            {difficultyLevel > 1 && (
              <button
                onClick={() => handleChoice('yellow')}
                className="py-5 bg-amber-50 border-2 border-amber-200 text-amber-700 font-black rounded-2xl hover:bg-amber-500 hover:text-white transition-all text-xs uppercase cursor-pointer shadow-sm"
              >
                {COLOR_NAMES.yellow[language]}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => handleChoice('box')}
              className="py-5 bg-slate-50 border-2 border-slate-200 text-slate-700 hover:bg-violet-600 hover:border-violet-600 hover:text-white font-black rounded-2xl transition-all text-xs cursor-pointer shadow-sm animate-fade-in"
            >
              {KIND_NAMES.box[language]}
            </button>
            <button
              onClick={() => handleChoice('envelope')}
              className="py-5 bg-slate-50 border-2 border-slate-200 text-slate-700 hover:bg-violet-600 hover:border-violet-600 hover:text-white font-black rounded-2xl transition-all text-xs cursor-pointer shadow-sm animate-fade-in"
            >
              {KIND_NAMES.envelope[language]}
            </button>
            {difficultyLevel > 1 && (
              <button
                onClick={() => handleChoice('bag')}
                className="py-5 bg-slate-50 border-2 border-slate-200 text-slate-700 hover:bg-violet-600 hover:border-violet-600 hover:text-white font-black rounded-2xl transition-all text-xs cursor-pointer shadow-sm animate-fade-in"
              >
                {KIND_NAMES.bag[language]}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
