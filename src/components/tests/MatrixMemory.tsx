import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';

interface MatrixMemoryProps {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

export default function MatrixMemory({ isTraining, onComplete, language }: MatrixMemoryProps) {
  const gridSize = 4; // 4x4 grid always for clinical standard
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'feedback'>('memorize');
  const [trial, setTrial] = useState(1);
  const [difficultyLevel, setDifficultyLevel] = useState(1); // 1, 2, or 3
  const [activeCell, setActiveCell] = useState<number | null>(null);
  
  const [stats, setStats] = useState({
    correct: 0,
    errors: 0,
    startTime: 0,
    totalTime: 0
  });

  const getSequenceLength = () => {
    // 3 levels of difficulty:
    // Level 1: Length 3
    // Level 2: Length 4
    // Level 3: Length 5
    if (difficultyLevel === 1) return 3;
    if (difficultyLevel === 2) return 4;
    return 5;
  };

  const totalTrials = isTraining ? 3 : 6; // 6 trials total (2 per level)

  const generateSequence = useCallback(() => {
    const totalCells = gridSize * gridSize;
    const length = getSequenceLength();
    const newSeq: number[] = [];
    
    while (newSeq.length < length) {
      const cell = Math.floor(Math.random() * totalCells);
      // Let's avoid consecutive repetitions in the sequence for clean design
      if (newSeq.length === 0 || newSeq[newSeq.length - 1] !== cell) {
        newSeq.push(cell);
      }
    }
    
    setSequence(newSeq);
    setUserSequence([]);
    setPhase('memorize');
    setActiveCell(null);

    // Flash animation logic
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        setActiveCell(newSeq[step]);
        step++;
        // Keep illuminated for 700ms, then a brief blank gap of 300ms
        setTimeout(() => {
          setActiveCell(null);
        }, 700);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setActiveCell(null);
          setPhase('recall');
          setStats(s => ({ ...s, startTime: Date.now() }));
        }, 800);
      }
    }, 1100);
  }, [difficultyLevel]);

  useEffect(() => {
    generateSequence();
  }, [trial, generateSequence]);

  const handleCellClick = (index: number) => {
    if (phase !== 'recall') return;
    
    const nextExpected = sequence[userSequence.length];
    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);

    if (index === nextExpected) {
      if (newUserSeq.length === sequence.length) {
        handleRoundEnd(true);
      }
    } else {
      handleRoundEnd(false);
    }
  };

  const handleRoundEnd = (success: boolean) => {
    const timeTaken = Date.now() - stats.startTime;
    setStats(s => ({
      ...s,
      correct: success ? s.correct + 1 : s.correct,
      errors: success ? s.errors : s.errors + 1,
      totalTime: s.totalTime + timeTaken
    }));

    setPhase('feedback');

    setTimeout(() => {
      if (trial < totalTrials) {
        // Systemic increase in difficulty after every 2 trials
        if (trial % 2 === 0) {
          setDifficultyLevel(dl => Math.min(3, dl + 1));
        }
        setTrial(t => t + 1);
      } else {
        // Completed
        const finalAccuracy = (stats.correct + (success ? 1 : 0)) / totalTrials;
        onComplete({
          averageReactionTime: stats.correct > 0 ? stats.totalTime / stats.correct : 0,
          correctCount: stats.correct + (success ? 1 : 0),
          errorCount: stats.errors + (success ? 0 : 1),
          accuracy: finalAccuracy
        }, []);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] max-w-xl mx-auto">
      <div className="mb-6 flex justify-between w-full text-slate-400 font-mono text-[10px] uppercase tracking-widest px-4">
         <div>TRIAL: {trial}/{totalTrials}</div>
         <div className="text-primary-600 font-bold">DIFFICULTY LEVEL: {difficultyLevel}/3</div>
         <div>SPAN: {getSequenceLength()} PATTERNS</div>
      </div>

      <h3 className="text-xl font-black mb-2 text-slate-900">
        {phase === 'memorize' 
          ? (language === 'ar' ? 'تذكر تسلسل وميض المربعات' : 'Mémorisez la séquence des carrés')
          : (language === 'ar' ? 'أعد النقر على المربعات بنفس الترتيب التتابعي!' : 'Recréez la séquence dans le même ordre !')}
      </h3>

      <p className="text-slate-600 text-xs px-6 mb-8">
         {phase === 'memorize'
           ? (language === 'ar' ? 'انتبه للمربعات التي تضيء تلو الآخر...' : 'Regardez les carrés s\'allumer un par un...')
           : (language === 'ar' ? 'انقر على نفس المربعات وبنفس الترتيب تماماً' : 'Cliquez sur les mêmes carrés dans le même ordre exact')}
      </p>

      <div 
        className="grid gap-3 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner w-full aspect-square max-w-sm" 
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const isFlashed = activeCell === i;
          const isUserClicked = userSequence.includes(i);
          const feedbackCorrect = sequence[userSequence.indexOf(i)] === i;

          let blockBg = 'bg-white border-slate-200';
          if (isFlashed) {
            blockBg = 'bg-primary-500 border-primary-400 shadow-md scale-105';
          } else if (phase === 'recall' && isUserClicked) {
            blockBg = feedbackCorrect 
              ? 'bg-green-500 border-green-400 shadow-md scale-105' 
              : 'bg-red-500 border-red-400 shadow-md scale-95';
          }

          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={phase !== 'recall'}
              className={`w-full h-full rounded-2xl border-2 transition-all duration-200 cursor-pointer ${blockBg} ${phase === 'recall' && !isUserClicked ? 'hover:bg-slate-100 hover:border-slate-300' : ''}`}
            />
          );
        })}
      </div>

      <div className="h-12 mt-6 flex items-center">
        <AnimatePresence mode="wait">
          {phase === 'feedback' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-2xl font-black ${userSequence.length === sequence.length && userSequence.every((v, index) => sequence[index] === v) ? 'text-green-600' : 'text-red-500'}`}
            >
              {userSequence.length === sequence.length && userSequence.every((v, index) => sequence[index] === v) 
                ? (language === 'ar' ? 'تسلسل صحيح! ✓' : 'Séquence correcte ! ✓') 
                : (language === 'ar' ? 'تسلسل خاطئ! ✗' : 'Séquence incorrecte ! ✗')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
