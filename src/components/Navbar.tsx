import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { auth } from '../lib/firebase';
import { LogOut, Languages, BrainCircuit } from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, user, t } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="glass-header">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-xl text-white shadow-[0_4px_15px_rgba(37,99,235,0.25)]">
            <BrainCircuit size={24} />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              NeuroCheck Pro
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden sm:block">Medical Assessment</p>
          </div>
        </Link>
 
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors tracking-widest"
          >
            <Languages size={14} />
            {language === 'ar' ? 'FR' : 'العربية'}
          </button>
 
          {user && (
            <div className="flex items-center gap-4 border-slate-200 border-r pr-4 rtl:border-r-0 rtl:border-l rtl:pl-4">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-800">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-primary-600 font-mono">STAFF_ID_{user.uid.slice(0, 5).toUpperCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200"
                title={t.logout}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
