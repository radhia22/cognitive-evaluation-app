import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { dbService } from '../services/dbService';
import { Patient, TestType } from '../types';
import { 
  Plus, 
  User, 
  ClipboardList, 
  BarChart3, 
  ChevronRight, 
  Users, 
  Activity,
  FileText,
  Trash2
} from 'lucide-react';

import ReportModal from '../components/ReportModal';

export default function DoctorDashboard() {
  const { user, t, language } = useApp();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', injuryType: '' });
  const [selectedPatientReport, setSelectedPatientReport] = useState<{ name: string; results: any[] } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPatients = async () => {
    setLoading(true);
    const data = await dbService.getPatients(user!.uid);
    if (data) setPatients(data);
    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    setLoading(true);
    try {
      await dbService.deletePatient(patientToDelete);
      setNotification({
        type: 'success',
        message: language === 'ar' ? 'تم حذف المريض بنجاح' : 'Patient supprimé avec succès'
      });
    } catch (e) {
      console.error(e);
      setNotification({
        type: 'error',
        message: language === 'ar' ? 'خطأ في حذف المريض' : 'Erreur lors de la suppression du patient'
      });
    } finally {
      setPatientToDelete(null);
      setLoading(false);
      await loadPatients();
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.age) return;
    
    setLoading(true);
    try {
      await dbService.createPatient(user!.uid, {
        name: newPatient.name,
        age: parseInt(newPatient.age),
        injuryType: newPatient.injuryType
      });
      
      setNewPatient({ name: '', age: '', injuryType: '' });
      setShowAddForm(false);
      setNotification({
        type: 'success',
        message: language === 'ar' ? 'تمت إضافة المريض بنجاح' : 'Patient ajouté avec succès'
      });
      await loadPatients();
    } catch (e) {
      console.error(e);
      setNotification({
        type: 'error',
        message: language === 'ar' ? 'خطأ في إضافة المريض' : 'Erreur lors de l\'ajout du patient'
      });
    } finally {
      setLoading(false);
    }
  };

  const openReport = async (patient: Patient) => {
    if (!user) return;
    setLoading(true);
    try {
      const results = await dbService.getResults(patient.id, user.uid);
      if (results && results.length > 0) {
        setSelectedPatientReport({ name: patient.name, results });
      } else {
        setNotification({
          type: 'error',
          message: language === 'ar' ? 'لا توجد نتائج اختبارات لهذا المريض بعد' : 'Aucun résultat de test pour ce patient.'
        });
      }
    } catch (e) {
      console.error(e);
      setNotification({
        type: 'error',
        message: language === 'ar' ? 'خطأ في تحميل النتائج' : 'Erreur lors du chargement des résultats'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary-500 font-black text-xs uppercase tracking-[0.3em]">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
            Administrative Portal
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight" style={{ borderColor: '#ffffff' }}>{t.doctorDashboard}</h1>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] mt-2 tracking-widest">
            <Users size={12} />
            <span>SENSORS_ACTIVE: {patients.length} PATIENTS_LOADED</span>
          </div>
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-sm ${
                notification.type === 'success' 
                  ? 'bg-green-600 border-green-500 text-white' 
                  : 'bg-red-600 border-red-500 text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="h-14 px-8 bg-primary-600 text-white font-bold rounded-2xl flex items-center gap-3 hover:bg-primary-700 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} />
          {t.addPatient}
        </button>
      </header>

      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
           <Users size={20} />
        </div>
        <input 
          type="text"
          placeholder={language === 'ar' ? 'بحث عن مريض...' : 'Rechercher un patient...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 font-medium"
        />
      </div>

      <AnimatePresence>
        {selectedPatientReport && (
          <ReportModal 
            patientName={selectedPatientReport.name} 
            results={selectedPatientReport.results} 
            language={language}
            onClose={() => setSelectedPatientReport(null)}
          />
        )}
        {patientToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 border border-slate-200 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                {language === 'ar' ? 'تاكيد الحذف' : 'Confirmer la suppression'}
              </h3>
              <p className="text-slate-600 text-sm mb-8">
                {language === 'ar' 
                  ? 'هل أنت متأكد من حذف هذا المريض؟ لا يمكن التراجع عن هذا الإجراء.' 
                  : 'Voulez-vous vraiment supprimer ce patient ? Cette action est irréversible.'}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setPatientToDelete(null)}
                  className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all font-medium text-sm"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 h-12 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm"
                >
                  {language === 'ar' ? 'حذف' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] p-10 border border-slate-200 shadow-2xl"
            >
              <h2 className="text-2xl font-black mb-8 text-slate-900 tracking-tight">{t.addPatient}</h2>
              <form onSubmit={handleAddPatient} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-1">{t.patientName}</label>
                  <input
                    type="text"
                    required
                    value={newPatient.name}
                    onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-1">{t.age}</label>
                    <input
                      type="number"
                      required
                      value={newPatient.age}
                      onChange={e => setNewPatient({...newPatient, age: e.target.value})}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-1">{t.injuryType}</label>
                    <input
                      type="text"
                      value={newPatient.injuryType}
                      onChange={e => setNewPatient({...newPatient, injuryType: e.target.value})}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                   <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all font-mono text-xs tracking-tighter"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-14 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 shadow-md active:scale-95 transition-all tracking-widest"
                  >
                    INITIATE
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-500 font-mono tracking-widest animate-pulse italic">EXTRACTING_PATIENT_RECORDS...</div>
        ) : patients.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-slate-200 border-dashed shadow-sm">
            <User className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              {language === 'ar' ? 'لا يوجد مرضى حالياً' : 'AUCUN PATIENT DETECTÉ'}
            </p>
          </div>
        ) : (
          <>
            {patients
              .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((patient) => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient} 
                  onOpenReport={() => openReport(patient)} 
                  onDelete={() => setPatientToDelete(patient.id)}
                />
              ))}
            {patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && searchTerm && (
              <div className="col-span-full py-10 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                {language === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'AUCUN PATIENT NE CORRESPOND A VOTRE RECHERCHE'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface PatientCardProps {
  key?: any;
  patient: Patient;
  onOpenReport: () => Promise<void> | void;
  onDelete: () => void;
}

function PatientCard({ 
  patient, 
  onOpenReport,
  onDelete
}: PatientCardProps) {
  const { t, language } = useApp();
  const [showTests, setShowTests] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-white rounded-[32px] border border-slate-200 p-8 hover:border-primary-400/50 hover:shadow-2xl transition-all group overflow-hidden relative shadow-md"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary-600/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 border border-slate-200 text-primary-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
              {patient.name[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{patient.name}</h3>
              <div className="flex gap-4 text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                <span>{t.age}: {patient.age}Y</span>
                <span className="flex items-center gap-1">
                  <Activity size={10} />
                  {patient.injuryType || 'NONE'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenReport}
              className="w-10 h-10 bg-slate-50 text-slate-500 rounded-lg hover:text-white hover:bg-primary-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all border border-slate-200 flex items-center justify-center group/btn cursor-pointer"
              title={t.viewReports}
            >
              <BarChart3 size={18} className="group-hover/btn:scale-110 transition-transform" />
            </button>
            <button 
              onClick={onDelete}
              className="w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:text-white hover:bg-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all border border-red-200 flex items-center justify-center group/del cursor-pointer"
              title="Delete Patient"
            >
              <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowTests(!showTests)}
          className="w-full py-4 px-5 bg-slate-50/50 border border-slate-200 rounded-2xl flex items-center justify-between group/btn hover:bg-slate-100/50 transition-all cursor-pointer"
        >
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ClipboardList size={14} />
            {t.assignTests}
          </span>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-mono text-primary-600 tracking-tighter">PROTOCOL_MG_V2</span>
             <ChevronRight size={14} className={`text-slate-400 transition-transform ${showTests ? 'rotate-90' : ''}`} />
          </div>
        </button>

        <AnimatePresence>
          {showTests && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-slate-100">
                <TestSelector patientId={patient.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
         <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border-[1.5px] border-white flex items-center justify-center text-[7px] font-black text-slate-450">
                {i}
              </div>
            ))}
         </div>
         <span className="text-[9px] text-slate-400 font-mono tracking-widest italic">STABLE_CONNECTION_L7</span>
      </div>
    </motion.div>
  );
}

function TestSelector({ patientId }: { patientId: string }) {
  const { user, t, language } = useApp();
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const [saving, setSaving] = useState(false);

  const testCategories = [
    {
      categoryId: 'central_executive',
      title: t.categories?.central_executive || 'Central Executive (Selective Attention)',
      testIds: ['selective_attention', 'central_verbal_shadowing', 'central_stroop_test'] as TestType[]
    },
    {
      categoryId: 'phonological_loop',
      title: t.categories?.phonological_loop || 'Phonological Loop',
      testIds: ['digit_span', 'phonological_story_creation', 'phonological_similarity'] as TestType[]
    },
    {
      categoryId: 'visuospatial_sketchpad',
      title: t.categories?.visuospatial_sketchpad || 'Visuospatial Sketchpad',
      testIds: ['matrix_memory', 'mental_map', 'visual_discrimination'] as TestType[]
    },
    {
      categoryId: 'inhibition',
      title: t.categories?.inhibition || 'Inhibition',
      testIds: ['go_no_go', 'task_switching', 'reverse_direction'] as TestType[]
    }
  ];

  const handleToggleTest = (id: TestType) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedTests.length === 0 || !user) return;
    setSaving(true);
    await dbService.assignTests(patientId, user.uid, selectedTests);
    setSaving(false);
    setSelectedTests([]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {testCategories.map((category) => (
          <div key={category.categoryId} className="space-y-2">
            <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
               {category.title}
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              {category.testIds.map((testId) => {
                const label = t.tests[testId] || testId;
                const isSelected = selectedTests.includes(testId);
                return (
                  <button
                    key={testId}
                    type="button"
                    onClick={() => handleToggleTest(testId)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left text-xs font-bold tracking-wide cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50 border-primary-200 text-primary-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-primary-500 border-primary-400 text-white' : 'border-slate-300'
                    }`}>
                       {isSelected && <span className="text-[8px]">✔</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <button
        type="button"
        onClick={handleAssign}
        disabled={selectedTests.length === 0 || saving}
        className="w-full h-12 bg-primary-600 text-white font-black rounded-xl disabled:opacity-35 disabled:cursor-not-allowed hover:bg-primary-700 transition-all shadow-md active:scale-95 text-xs tracking-widest mt-4 uppercase cursor-pointer"
      >
        {saving ? 'RE-SYNCING...' : 'UPDATE_PROTOCOL'}
      </button>
    </div>
  );
}
