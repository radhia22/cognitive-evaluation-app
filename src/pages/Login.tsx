import React from 'react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useApp } from '../App';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { language } = useApp();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/doctor');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <motion.div 
        className="bg-white/80 backdrop-blur-md p-12 rounded-[48px] border border-slate-200 shadow-xl text-center relative z-10"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="w-20 h-20 bg-primary-600 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white shadow-md">
          <LogIn size={40} />
        </div>
        
        <div className="mb-10">
          <span className="px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-[10px] font-black uppercase tracking-widest">
            Medical Staff Access
          </span>
          <h1 className="text-3xl font-black mt-4 text-slate-900 tracking-tight">
            {language === 'ar' ? 'بوابة الدخول الآمنة' : 'Secure Staff Portal'}
          </h1>
          <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest mt-2">
            Protocol Monitoring Environment
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full h-18 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-4 hover:bg-slate-100 hover:border-primary-500 transition-all active:scale-[0.98] group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" />
          <span className="tracking-widest">
            {language === 'ar' ? 'الدخول بواسطة Google' : 'G-AUTH SESSION'}
          </span>
        </button>

        <p className="mt-12 text-slate-600 font-mono text-[8px] uppercase tracking-[0.4em] leading-loose">
          Authorized Terminal Only<br/>
          AES-256 Cloud Sync Active
        </p>
      </motion.div>
    </div>
  );
}
