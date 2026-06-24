import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Patient, TestAssignment } from '../types';

import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PatientInterface() {
  const { user, t, language } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  const handleSearch = async () => {
    if (!patientName) return;
    
    if (!user) {
      alert(language === 'ar' ? 'يجب تسجيل دخول الأخصائي أولاً' : 'Le médecin doit être connecté d\'abord');
      return;
    }

    setLoading(true);
    setError(null);
    const path = 'patients';
    try {
      const trimmedName = patientName.trim();
      // Try exact match first
      const q = query(
        collection(db, path),
        where('name', '==', trimmedName),
        where('doctorId', '==', user.uid)
      );
      let snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const p = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Patient;
        setCurrentPatient(p);
        
        // Fetch assignments for this specific patient
        const assigns = await dbService.getAssignments(p.id, user.uid);
        if (assigns) {
          const pending = assigns.filter(a => a.status === 'pending');
          // Filter unique test types across all pending assignments
          const uniqueTestTypes = [...new Set(pending.flatMap(a => a.testIds))];
          
          if (uniqueTestTypes.length > 0) {
            setAssignments([{
              id: pending[0].id, // Use the ID of the first pending assignment
              patientId: p.id,
              doctorId: user.uid,
              testIds: uniqueTestTypes,
              status: 'pending',
              assignedAt: pending[0].assignedAt
            }]);
          } else {
            setAssignments([]);
          }
        }
        setStep(2);
      } else {
        setError(language === 'ar' 
          ? `المريض "${trimmedName}" غير موجود في سجلاتك. يرجى التأكد من كتابة الاسم بالكامل وبدقة.` 
          : `Le patient "${trimmedName}" n'est pas dans vos dossiers. Veuillez vous assurer d'écrire le nom complet exactement.`);
      }
    } catch (e) {
      console.error(e);
      setError('Connection Error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div 
        className="bg-white rounded-[48px] p-12 border border-slate-200 shadow-xl relative overflow-hidden text-center"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-800">
           <User size={160} />
        </div>

        {step === 1 ? (
          <div className="relative z-10">
            {!user && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                {language === 'ar' ? 'يجب تسجيل دخول الأخصائي للوصول للسجلات' : 'Staff authentication required for access'}
              </div>
            )}
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-primary-50 text-primary-600 border border-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-sm"
            >
              <User size={48} />
            </motion.div>
            
            <div className="mb-12">
              <span className="px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-[10px] font-black uppercase tracking-widest">
                Authentication Required
              </span>
              <h1 className="text-4xl font-black mb-4 text-slate-900 tracking-tight mt-4">{t.patientInterface}</h1>
              <p className="text-slate-500 font-medium">
                {language === 'ar' ? 'يرجى إدخال اسمك للبدء' : 'Veuillez entrer votre nom pour commencer'}
              </p>
            </div>
            
            <div className="space-y-6">
              <input
                type="text"
                placeholder={t.fullName}
                value={patientName}
                onChange={e => {
                  setPatientName(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full h-20 bg-slate-50 border rounded-3xl px-8 text-2xl font-bold text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all text-center tracking-tight placeholder:text-slate-400 shadow-inner ${error ? 'border-red-500/50' : 'border-slate-200'}`}
              />

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="cognitive-button w-full bg-primary-600 text-white h-20 text-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] tracking-widest"
              >
                {loading ? 'SYNCHRONIZING...' : (language === 'ar' ? 'بحث' : 'IDENTIFYING')}
                <div className="flex items-center gap-1">
                   {language === 'ar' ? <ArrowLeft size={28} /> : <ArrowRight size={28} />}
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="mb-12">
               <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-2xl mx-auto mb-6 flex items-center justify-center text-primary-600 shadow-sm">
                  <User size={32} />
               </div>
               <h2 className="text-4xl font-black mb-2 text-slate-900 tracking-tight">
                {language === 'ar' ? `مرحباً ${currentPatient?.name}` : `Bienvenue ${currentPatient?.name}`}
              </h2>
              <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                {language === 'ar' ? 'لديك الاختبارات التالية لإتمامها:' : 'PROTOCOLS_READY_FOR_EXECUTION'}
              </p>
            </div>

            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="p-12 bg-slate-50 rounded-[32px] border border-slate-200 border-dashed text-slate-500 italic font-mono text-xs tracking-widest leading-relaxed">
                  {language === 'ar' ? 'لا يوجد اختبارات معينة حالياً' : 'INTERVENTION_PENDING\nCONTACT_STAFF_FOR_ASSIGNMENT'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {assignments[0].testIds.map(testType => (
                    <button
                      key={testType}
                      onClick={() => navigate(`/test/${testType}?assignment=${assignments[0].id}&patient=${currentPatient?.id}&doctor=${user?.uid}`)}
                      className="group flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-primary-600 hover:border-primary-500 transition-all cursor-pointer"
                    >
                      <span className="text-xl font-bold text-slate-800 group-hover:text-white">{t.tests[testType]}</span>
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-primary-700/50 group-hover:text-white transition-all">
                         {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-12 text-slate-600 font-black text-[10px] tracking-[0.3em] uppercase hover:text-red-400 transition-colors"
            >
              {language === 'ar' ? 'تغيير المريض' : 'SWITCH_IDENTITY'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
