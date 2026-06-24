import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestMetrics } from '../../types';
import { Volume2, Play, AlertCircle } from 'lucide-react';

interface Props {
  isTraining: boolean;
  onComplete: (metrics: TestMetrics, rawData: any[]) => void;
  language: 'ar' | 'fr';
}

interface Story {
  text: string;
  audioText: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
}

const STORIES = {
  ar: [
    {
      text: "في صباح يوم ربيعي دافئ، ذهب أحمد إلى السوق لشراء خمس تفاحات حمراء وثلاث موزات صفراء. في الطريق، التقى بصديقه خالد الذي كان يحمل مظلة زرقاء بالرغم من أن السماء كانت صافية تماماً.",
      audioText: "في صباح يوم ربيعي دافئ، ذهب أحمد إلى السوق لشراء خمس تفاحات حمراء وثلاث موزات صفراء. في الطريق، التقى بصديقه خالد الذي كان يحمل مظلة زرقاء بالرغم من أن السماء كانت صافية تماماً.",
      questions: [
        {
          question: "كم عد التفاحات التي أراد أحمد شراءها؟",
          options: ["3 تفاحات", "5 تفاحات", "10 تفاحات", "تعديل تفاحتين"],
          correctIndex: 1
        },
        {
          question: "ماذا كان يحمل خالد في يده؟",
          options: ["حقيبة صفراء", "سلة فواكه", "مظلة زرقاء", "كتاب أحمر"],
          correctIndex: 2
        },
        {
          question: "كيف كان حال الطقس والسماء؟",
          options: ["ممطر وغائم", "صافية تماماً", "عاصف ومغبر", "لا شيء مما سبق"],
          correctIndex: 1
        }
      ]
    }
  ],
  fr: [
    {
      text: "Par une douce matinée de printemps, Thomas s'est rendu au marché pour acheter cinq pommes rouges et trois bananes jaunes. En chemin, il a rencontré son ami David, qui portait un parapluie bleu alors que le ciel était parfaitement dégagé.",
      audioText: "Par une douce matinée de printemps, Thomas s'est rendu au marché pour acheter cinq pommes rouges et trois bananes jaunes. En chemin, il a rencontré son ami David, qui portait un parapluie bleu alors que le ciel était parfaitement dégagé.",
      questions: [
        {
          question: "Combien de pommes Thomas voulait-il acheter ?",
          options: ["3 pommes", "5 pommes", "10 pommes", "2 pommes pourries"],
          correctIndex: 1
        },
        {
          question: "Qu'est-ce que David portait à la main ?",
          options: ["Un sac jaune", "Un panier de fruits", "Un parapluie bleu", "Un livre rouge"],
          correctIndex: 2
        },
        {
          question: "Quel temps faisait-il ?",
          options: ["Pluvieux et nuageux", "Le ciel était parfaitement dégagé", "Orageux", "Il neigeait"],
          correctIndex: 1
        }
      ]
    }
  ]
};

export default function ShadowingTest({ isTraining, onComplete, language }: Props) {
  const storiesList = STORIES[language] || STORIES['fr'];
  const story = storiesList[0]; // Active story

  const [phase, setPhase] = useState<'intro' | 'listening' | 'questions'>('intro');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const speakText = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPhase('listening');
    
    // Set up speech synthesis
    const utterance = new SpeechSynthesisUtterance(story.audioText);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'fr-FR';
    utterance.rate = 0.85; // Slightly slower for auditory focus
    
    utterance.onend = () => {
      setIsPlaying(false);
      setPhase('questions');
      setStartTime(Date.now());
    };

    utterance.onerror = () => {
      // Fallback if SpeechSynthesis fails/is blocked in iframe
      setTimeout(() => {
        setIsPlaying(false);
        setPhase('questions');
        setStartTime(Date.now());
      }, isTraining ? 8000 : 15000);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleAnswer = (index: number) => {
    const timeTaken = Date.now() - startTime;
    setReactionTimes(prev => [...prev, timeTaken]);

    const isCorrect = index === story.questions[currentQuestion].correctIndex;
    if (isCorrect) {
      setCorrectAnswers(c => c + 1);
    } else {
      setWrongAnswers(w => w + 1);
    }

    if (currentQuestion + 1 < story.questions.length) {
      setCurrentQuestion(q => q + 1);
      setStartTime(Date.now());
    } else {
      // Complete
      const totalQ = story.questions.length;
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : timeTaken;
        
      onComplete({
        averageReactionTime: avgReactionTime,
        correctCount: correctAnswers + (isCorrect ? 1 : 0),
        errorCount: wrongAnswers + (isCorrect ? 0 : 1),
        accuracy: (correctAnswers + (isCorrect ? 1 : 0)) / totalQ
      }, []);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-slate-200 shadow-xl min-h-[500px] text-center max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto border-2 border-primary-200">
              <Volume2 size={36} className="animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900">
              {language === 'ar' ? 'اختبار التكرار السمعي للمواضيع' : 'Test de répétition verbale de thèmes'}
            </h3>
            
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
              {language === 'ar' 
                ? "سوف تستمع الآن إلى قصة قصيرة يرويها الأخصائي الآلي. يرجى التركيز جيداً على التفاصيل والأعداد والصفات لأننا سنطرح عليك أسئلة دقيقة حولها." 
                : "Vous allez maintenant écouter une histoire courte lue à haute voix. Veuillez vous concentrer sur les détails, les nombres et les adjectifs, car nous allons vous poser des questions précises."}
            </p>

            <button
               onClick={speakText}
               className="px-10 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-3xl font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto cursor-pointer"
            >
              <Play size={20} />
              {language === 'ar' ? "ابدأ الاستماع للقصة" : "Écouter l'histoire"}
            </button>
          </motion.div>
        )}

        {phase === 'listening' && (
          <motion.div 
            key="listening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 animate-fade-in"
          >
            <div className="w-24 h-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto border-4 border-green-200 animate-pulse" />
            
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-widest">
              {language === 'ar' ? "جارٍ إلقاء القصة السمعية..." : "Lecture de l'histoire en cours..."}
            </h3>
            
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg mx-auto italic text-slate-600 select-none text-xs">
              {language === 'ar' 
                ? "استمع بتركيز بدون مغادرة الصفحة... (سيتم الانتقال للأسئلة تلقائياً بكبسة زر أو بعد الانتهاء)"
                : "Écoutez attentivement... Le test passera automatiquement aux questions à la fin."}
            </div>
            
            {/* Action button to skip in case speech synthesis takes too long or is silent */}
            <button
               onClick={() => {
                 window.speechSynthesis.cancel();
                 setPhase('questions');
                 setStartTime(Date.now());
               }}
               className="text-xs text-slate-500 underline hover:text-slate-700 transition cursor-pointer"
            >
              {language === 'ar' ? "التالي مباشرة للأسئلة" : "Passer directement aux questions"}
            </button>
          </motion.div>
        )}

        {phase === 'questions' && (
          <motion.div 
            key="questions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 w-full animate-fade-in"
          >
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
              QUESTION {currentQuestion + 1} / {story.questions.length}
            </div>

            <h3 className="text-2xl font-black text-slate-900 px-4 leading-tight">
              {story.questions[currentQuestion].question}
            </h3>

            <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto">
              {story.questions[currentQuestion].options.map((option, index) => (
                <button
                   key={index}
                   onClick={() => handleAnswer(index)}
                   className="w-full py-5 px-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary-500 text-slate-800 hover:text-primary-600 font-bold text-sm transition-all hover:bg-slate-100 active:scale-95 text-center flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
