import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { TestType, TestMetrics } from '../types';
import { dbService } from '../services/dbService';

// Test Components
import GoNoGo from '../components/tests/GoNoGo';
import SelectiveAttention from '../components/tests/SelectiveAttention';
import ShadowingTest from '../components/tests/ShadowingTest';
import StroopTest from '../components/tests/StroopTest';
import TaskSwitching from '../components/tests/TaskSwitching';
import MatrixMemory from '../components/tests/MatrixMemory';
import DigitSpan from '../components/tests/DigitSpan';
import StoryCreation from '../components/tests/StoryCreation';
import PhonologicalSimilarity from '../components/tests/PhonologicalSimilarity';
import MentalMap from '../components/tests/MentalMap';
import VisualDiscrimination from '../components/tests/VisualDiscrimination';
import ReverseDirection from '../components/tests/ReverseDirection';

export default function TestRunner() {
  const { testType } = useParams<{ testType: TestType }>();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const patientId = searchParams.get('patient');
  const doctorId = searchParams.get('doctor');
  
  const { user, t, language } = useApp();
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState<'instructions' | 'training' | 'actual' | 'results' | 'pdf'>('instructions');
  const [results, setResults] = useState<TestMetrics | null>(null);

  const handleComplete = async (metrics: TestMetrics, rawData: any[]) => {
    setResults(metrics);
    setPhase('results');

    const effectiveDoctorId = doctorId || user?.uid;

    if (assignmentId && patientId && testType && effectiveDoctorId) {
      await dbService.saveTestResult({
        assignmentId,
        patientId,
        doctorId: effectiveDoctorId,
        testType: testType as TestType,
        metrics,
        rawData
      });
    }
  };

  const renderTest = () => {
    const commonProps = {
      isTraining: phase === 'training',
      onComplete: handleComplete,
      language
    };

    switch (testType) {
      case 'go_no_go':
        return <GoNoGo {...commonProps} />;
      case 'selective_attention':
        return <SelectiveAttention {...commonProps} />;
      case 'central_verbal_shadowing':
        return <ShadowingTest {...commonProps} />;
      case 'central_stroop_test':
        return <StroopTest {...commonProps} />;
      case 'task_switching':
        return <TaskSwitching {...commonProps} />;
      case 'matrix_memory':
        return <MatrixMemory {...commonProps} />;
      case 'digit_span':
        return <DigitSpan {...commonProps} />;
      case 'phonological_story_creation':
        return <StoryCreation {...commonProps} />;
      case 'phonological_similarity':
        return <PhonologicalSimilarity {...commonProps} />;
      case 'mental_map':
        return <MentalMap {...commonProps} />;
      case 'visual_discrimination':
        return <VisualDiscrimination {...commonProps} />;
      case 'reverse_direction':
        return <ReverseDirection {...commonProps} />;
      default:
        return (
          <div className="p-12 text-center text-gray-500 italic">
            {language === 'ar' ? 'هذا الاختبار قيد التطوير حالياً' : 'Ce test est en cours de développement'}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 min-h-[70vh] flex flex-col">
      <AnimatePresence mode="wait">
        {phase === 'instructions' && (
          <motion.div 
            key="instructions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] p-10 md:p-16 shadow-2xl flex-1 flex flex-col justify-center text-center"
          >
            <h1 className="text-4xl font-black mb-8 text-primary-600">{t.tests[testType as TestType]}</h1>
            <div className="text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto mb-16 whitespace-pre-wrap">
              {getInstructions(testType as TestType, language)}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <button
                onClick={() => setPhase('training')}
                className="cognitive-button flex-1 bg-gray-100 text-gray-800"
              >
                {t.trainingMode}
              </button>
              <button
                onClick={() => setPhase('actual')}
                className="cognitive-button flex-1 bg-primary-600 text-white"
              >
                {t.actualTest}
              </button>
            </div>
          </motion.div>
        )}

        {(phase === 'training' || phase === 'actual') && (
          <motion.div 
            key="test"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <div className="mb-4 flex justify-between items-center bg-white px-6 py-3 rounded-2xl shadow-sm">
              <span className="font-bold text-lg text-primary-600">
                {phase === 'training' ? t.trainingMode : t.actualTest}
              </span>
              <button onClick={() => navigate('/patient')} className="text-gray-400 font-bold hover:text-red-500">
                {language === 'ar' ? 'خروج' : 'Quitter'}
              </button>
            </div>
            {renderTest()}
          </motion.div>
        )}

        {phase === 'results' && results && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-10 md:p-16 shadow-2xl text-center"
          >
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-black mb-4">
                {language === 'ar' ? 'تم الانتهاء بنجاح!' : 'Félicitations !'}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              <div className="p-6 bg-gray-50 rounded-3xl">
                <div className="text-sm text-gray-500 mb-1">{t.metrics.reactionTime}</div>
                <div className="text-2xl font-black">{Math.round(results.averageReactionTime)}ms</div>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl">
                <div className="text-sm text-gray-500 mb-1">{t.metrics.correct}</div>
                <div className="text-2xl font-black text-green-600">{results.correctCount}</div>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl">
                <div className="text-sm text-gray-500 mb-1">{t.metrics.errors}</div>
                <div className="text-2xl font-black text-red-500">{results.errorCount}</div>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl">
                <div className="text-sm text-gray-500 mb-1">{t.metrics.accuracy}</div>
                <div className="text-2xl font-black text-primary-600">{Math.round(results.accuracy * 100)}%</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/patient')}
              className="cognitive-button w-full bg-primary-600 text-white"
            >
              {t.finish}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getInstructions(type: TestType, lang: 'ar' | 'fr'): string {
  const instructions = {
    go_no_go: {
      ar: "ستظهر لك أضواء ملونة.\nاضغط عندما يظهر الضوء الأزرق (اذهب).\nلا تضغط عندما يظهر الضوء الأحمر (توقف).",
      fr: "Des lumières colorées vont apparaître.\nAppuyez lorsque la lumière Bleue apparaît (GO).\nNe pas appuyez lorsque la lumière Rouge apparaît (STOP)."
    },
    selective_attention: {
      ar: "سوف تسمع تسلسل أسماء أيام الأسبوع.\nاضغط فقط عندما تسمع كلمة 'الأحد'.",
      fr: "Vous allez entendre une séquence de jours de la semaine.\nAppuyez uniquement lorsque vous entendez le mot 'Dimanche'."
    },
    central_verbal_shadowing: {
      ar: "سوف تستمع إلى قصة قصيرة يرويها الأخصائي الآلي.\nيرجى التركيز على الأحداث والتفاصيل لكي تجيب على الأسئلة السمعية بدقة لاحقاً.",
      fr: "Vous allez écouter une histoire racontée par la synthèse vocale.\nS'il vous plaît concentrez-vous pour répondre précisément aux questions de compréhension à la fin."
    },
    central_stroop_test: {
      ar: "ستظهر لك أسماء ألوان مكتوبة بحبر ملون مختلف.\nاضغط على لون حبر الخط المكتوب وليس الكلمة المكتوبة بالتفصيل!",
      fr: "Des noms de couleurs vont s'afficher avec d'autres encres.\nSélectionnez la couleur de l'encre (police) et non pas la signification du mot !"
    },
    task_switching: {
      ar: "ستظهر طرود بريدية رقمية بأشكال وألوان مختلفة.\nصنف الطرود بالضغط على الأزرار الملائمة حسب القاعدة النشطة حالياً (صنف حسب اللون أو حسب نوع الطرد).",
      fr: "Des colis numériques s'affichent avec des styles et couleurs variables.\nTriez les plis en fonction de la consigne changeante (selon le type de pli ou selon la couleur)."
    },
    matrix_memory: {
      ar: "ستظهر شبكة من المربعات وتومض تتابعياً.\nتذكر التسلسل ومسار الوميض بدقة.\nثم أعد النقر على المربعات بنفس الترتيب التتابعي تماماً.",
      fr: "Une grille séquentielle va s'illuminer.\nMémorisez précisément l'itinéraire de clignotement.\nPuis cliquez sur les cases dans le même ordre exact."
    },
    digit_span: {
      ar: "ستسمع سلسلة أرقام متتالية.\nفي وضع الترتيب المباشر: أعد كتابتها بنية كما سمعتها.\nفي وضع الترتيب العكسي: أعد كتابتها بعكس التسلسل (من الأخير للأول).",
      fr: "Vous allez entendre des chiffres lus l'un après l'autre.\nEn ordre direct : saisissez les chiffres comme entendus.\nEn ordre inverse : saisissez-les à l'envers."
    },
    phonological_story_creation: {
      ar: "سنعرض عليك 3 كلمات عشوائية.\nاكتب جملة مفيدة أو قصة قصيرة تربط بين الكلمات الثلاث بذكاء وتجمعها معاً في النص.",
      fr: "Nous allons afficher 3 mots distincts.\nÉcrivez une phrase ou une courte histoire qui lie et intègre élégamment ces 3 mots."
    },
    phonological_similarity: {
      ar: "ستظهر لك كلمتان جانبيتان.\nحدد إذا كانتا تتشابهان في النغمة الصوتية أو النطق الصوتي الفونولوجي بالضغط على الأزرار.",
      fr: "Deux mots s'affichent par paire.\nDéterminez s'ils riment ensemble ou s'ils possèdent une régularité de son."
    },
    mental_map: {
      ar: "تذكر مسار الزيارة بين معالم الخريطة الجغرافية (المسجد، الحديقة، المنزل...).\nثم أعد رسم المسار بالترتيب الصحيح.",
      fr: "Mémorisez l'itinéraire reliant les monuments (mosquée, jardin, maison...).\nPuis tracez-le dans le bon ordre géographique."
    },
    visual_discrimination: {
      ar: "ستظهر لك لوحتان جانبيتان لشبكتين مظللتين.\nقرر بسرعة ودقة إذا كانتا متطابقتين تماماً أم مختلفتين وتتدرج الصعوبة.",
      fr: "Deux grilles complexes s'affichent à l'écran.\nDéterminez le plus tôt possible si elles sont strictement identiques ou différentes."
    },
    reverse_direction: {
      ar: "سيظهر سهم يشير إلى اتجاه معين بشكل مفاجئ.\nاضغط فوراً على الزر الذي يشير إلى الاتجاه المعاكس تماماً مع زيادة متدرجة للسرعة.",
      fr: "Une flèche s'affiche soudainement dans une direction.\nAppuyez au plus vite sur le bouton indiquant la direction opposée."
    }
  };
  return instructions[type as keyof typeof instructions]?.[lang] || "Instructions loading...";
}
