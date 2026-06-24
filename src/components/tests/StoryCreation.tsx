import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';
import { PenTool, CheckCircle, HelpCircle } from 'lucide-react';

interface Props {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

const WORD_TRIPLETS = {
  ar: [
    ['قطة', 'شجرة', 'مفتاح'],
    ['قمر', 'حقيبة', 'كتاب'],
    ['بحر', 'طائرة', 'تفاحة'],
    ['حصان', 'قلم', 'سماء']
  ],
  fr: [
    ['chat', 'arbre', 'clé'],
    ['lune', 'sac', 'livre'],
    ['mer', 'avion', 'pomme'],
    ['cheval', 'stylo', 'ciel']
  ]
};

export default function StoryCreation({ isTraining, onComplete, language }: Props) {
  const triplets = WORD_TRIPLETS[language] || WORD_TRIPLETS['fr'];
  const [currentTriplet, setCurrentTriplet] = useState<string[]>([]);
  const [userText, setUserText] = useState('');
  const [round, setRound] = useState(1);
  const maxRounds = isTraining ? 1 : 3;

  const [stats, setStats] = useState({
    correct: 0,
    errors: 0,
    startTime: 0
  });

  useEffect(() => {
    setSelectedTriplet();
  }, [round]);

  const setSelectedTriplet = () => {
    // Select a triplet
    const chosen = triplets[Math.floor(Math.random() * triplets.length)];
    setCurrentTriplet(chosen);
    setUserText('');
    setStats(s => ({ ...s, startTime: Date.now() }));
  };

  const getWordStatus = (word: string) => {
    if (!userText) return false;
    // Simple normalization check (handles Arabic Alif/Ta-marbuta slightly or French accents/cases)
    const normalizedText = userText.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
    const normalizedWord = word.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
    return normalizedText.includes(normalizedWord);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if words are integrated
    const word1Ok = getWordStatus(currentTriplet[0]);
    const word2Ok = getWordStatus(currentTriplet[1]);
    const word3Ok = getWordStatus(currentTriplet[2]);

    const success = word1Ok && word2Ok && word3Ok;
    const timeTaken = Date.now() - stats.startTime;

    const roundScore = (word1Ok ? 1 : 0) + (word2Ok ? 1 : 0) + (word3Ok ? 1 : 0);

    setStats(s => ({
      ...s,
      correct: s.correct + roundScore
    }));

    if (round < maxRounds) {
      setRound(r => r + 1);
    } else {
      // Complete
      const totalPossible = maxRounds * 3;
      onComplete({
        averageReactionTime: timeTaken,
        correctCount: stats.correct + roundScore,
        errorCount: totalPossible - (stats.correct + roundScore),
        accuracy: (stats.correct + roundScore) / totalPossible
      }, []);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] text-center max-w-xl mx-auto">
      <div className="w-full flex justify-between text-slate-400 font-mono text-[10px] uppercase tracking-widest mb-6">
        <div>ROUND: {round} / {maxRounds}</div>
        <div>STORY ASSIGNMENT</div>
      </div>

      <div className="w-16 h-16 rounded-3xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 mb-6">
        <PenTool size={28} />
      </div>

      <h3 className="text-xl font-black text-slate-900 mb-2">
        {language === 'ar' ? 'الدمج وتكوين قصة قصيرة أو جملة مفيدة' : 'Fusion verbale & Création d\'histoire'}
      </h3>
      
      <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto mb-8">
        {language === 'ar' 
          ? "اكتب جملة واحدة أو قصة قصيرة تحتوي بالتفصيل على الكلمات الثلاثة التالية بذكاء:"
          : "Écrivez une phrase ou une histoire courte qui contient intelligemment les trois mots suivants :"}
      </p>

      {/* Words display */}
      <div className="flex justify-center flex-wrap gap-3 mb-8 w-full">
        {currentTriplet.map((word, i) => {
          const used = getWordStatus(word);
          return (
            <motion.div
              key={word}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${
                used 
                  ? 'bg-green-50 border border-green-200 text-green-600 shadow-md' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <span>{word}</span>
              {used && <CheckCircle size={14} className="text-green-600" />}
            </motion.div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <textarea
          autoFocus
          rows={4}
          value={userText}
          onChange={e => setUserText(e.target.value)}
          placeholder={language === 'ar' ? 'اكتب جملتك المترابطة هنا...' : 'Écrivez votre phrase cohérente ici...'}
          className="w-full bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 text-slate-800 font-medium focus:bg-white focus:border-primary-500 outline-none transition-all resize-none text-sm placeholder:text-slate-400 shadow-inner"
        />

        <div className="flex justify-between items-center px-2">
          {/* Missing word indicators */}
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
             <HelpCircle size={12} />
             {language === 'ar' 
               ? "يجب دمج الكلمات ليصبح الزر نشطاً" 
               : "Incorporez les mots pour valider"}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
             {userText.length} chars
          </span>
        </div>

        <button
          type="submit"
          disabled={!getWordStatus(currentTriplet[0]) || !getWordStatus(currentTriplet[1]) || !getWordStatus(currentTriplet[2])}
          className="w-full h-16 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-3xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest cursor-pointer"
        >
          {language === 'ar' ? 'تأكيد وحفظ القصة' : 'Valider & Enregistrer'}
        </button>
      </form>
    </div>
  );
}
