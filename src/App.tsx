import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Language } from './types';
import { translations } from './translations';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientInterface from './pages/PatientInterface';
import TestRunner from './pages/TestRunner';
import Login from './pages/Login';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User | null;
  loading: boolean;
  t: typeof translations['ar'];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    language,
    setLanguage,
    user,
    loading,
    t: translations[language]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-primary-500/30" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Navbar />
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/5 rounded-full blur-[150px]"></div>
          </div>
          <main className="container mx-auto px-4 py-8 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/doctor" 
                element={user ? <DoctorDashboard /> : <Navigate to="/login" />} 
              />
              <Route path="/patient" element={<PatientInterface />} />
              <Route path="/test/:testType" element={<TestRunner />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  );
}
