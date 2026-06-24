import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Stethoscope, UserCircle } from 'lucide-react';

export default function Home() {
  const { t, language } = useApp();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 relative">
      <header className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 text-xs uppercase tracking-[0.2em] font-bold mb-6"
        >
          {language === 'ar' ? 'بيئة طبية متطورة' : 'Medical Environment'}
        </motion.div>
        <motion.h1 
          className="text-5xl md:text-6xl font-black mb-6 text-slate-900 tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t.title}
        </motion.h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          {language === 'ar' 
            ? 'نظام رقمي متطور لتقييم الذاكرة العاملة والوظائف التنفيذية'
            : 'Un système numérique avancé pour l\'évaluation de la mémoire de travail et des fonctions exécutives'}
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.button
          onClick={() => navigate('/doctor')}
          className="cognitive-card text-right rtl:text-right ltr:text-left flex flex-col items-center p-10 gap-8 group relative overflow-hidden"
          whileHover={{ y: -5, borderColor: 'rgba(59,130,246,0.5)' }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-primary-500 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all duration-300">
            <Stethoscope size={40} />
          </div>
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-bold mb-3 text-slate-900">{t.doctorDashboard}</h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              {language === 'ar' 
                ? 'إدارة المرضى، تعيين الاختبارات، وتحليل التقارير'
                : 'Gestion des patients, assignation des tests et analyse des rapports'}
            </p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => navigate('/patient')}
          className="cognitive-card text-center flex flex-col items-center p-10 gap-8 group relative overflow-hidden"
          whileHover={{ y: -5, borderColor: 'rgba(34,197,94,0.5)' }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-600 group-hover:text-white group-hover:shadow-[0_4px_20px_rgba(34,197,94,0.25)] transition-all duration-300">
            <UserCircle size={40} />
          </div>
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-bold mb-3 text-slate-900">{t.patientInterface}</h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              {language === 'ar' 
                ? 'واجهة بسيطة لاداء الاختبارات المعرفية'
                : 'Interface simple pour effectuer les tests cognitifs'}
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
