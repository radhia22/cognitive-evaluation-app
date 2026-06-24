import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { TestResult, TestType, Language } from '../types';
import { translations } from '../translations';
import { FileDown, Brain, Zap, XCircle, CheckCircle } from 'lucide-react';

interface Props {
  patientName: string;
  results: TestResult[];
  onClose: () => void;
  language: Language;
}

export default function ReportModal({ patientName, results, onClose, language }: Props) {
  const t = translations[language];
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Prepare chart data
  const radarData = results.map(r => ({
    subject: t.tests[r.testType],
    score: r.metrics.accuracy * 100,
    fullMark: 100
  }));

  const fetchAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch('/api/analyze-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metrics: results.map(r => ({ test: r.testType, ...r.metrics })),
          lang: language 
        })
      });
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (e) {
      console.error(e);
    }
    setLoadingAnalysis(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Report: ${patientName}`, 20, 20);
    doc.setFontSize(14);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // @ts-ignore
    doc.autoTable({
      startY: 40,
      head: [['Test', 'Accuracy (%)', 'Avg RT (ms)', 'Errors']],
      body: results.map(r => [
        t.tests[r.testType],
        Math.round(r.metrics.accuracy * 100),
        Math.round(r.metrics.averageReactionTime),
        r.metrics.errorCount
      ])
    });

    if (analysis) {
      // @ts-ignore
      doc.text("AI Clinical Insights:", 20, doc.lastAutoTable.finalY + 10);
      // @ts-ignore
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(analysis, 170);
      // @ts-ignore
      doc.text(splitText, 20, doc.lastAutoTable.finalY + 20);
    }

    doc.save(`NeuroPsych_Report_${patientName}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-950 w-full max-w-6xl h-[92vh] rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-800 flex flex-col overflow-hidden"
      >
        <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary-600/20 text-primary-400 text-[10px] font-black uppercase tracking-widest border border-primary-500/20">
                Cognitive Report
              </span>
              <span className="text-slate-600 text-xs font-mono tracking-widest">SESSION_REF: {new Date().getTime().toString().slice(-6)}</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">{patientName}</h2>
          </div>
          <div className="flex gap-4">
            <button
              onClick={exportPDF}
              className="px-8 h-14 bg-primary-600 text-white font-bold rounded-2xl flex items-center gap-3 hover:bg-primary-700 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-95"
            >
              <FileDown size={20} />
              {language === 'ar' ? 'تصدير PDF' : 'Exporter PDF'}
            </button>
            <button
              onClick={onClose}
              className="w-14 h-14 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-2xl flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-gradient-to-b from-transparent to-slate-900/20">
          {results.length === 0 ? (
            <div className="py-20 text-center text-slate-600 font-bold uppercase tracking-widest italic flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700">
                <Brain size={40} />
              </div>
              No data clusters detected in clinical storage.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Charts Section */}
              <div className="space-y-8">
                <div className="bg-slate-900/60 rounded-[40px] p-10 border border-slate-800 h-[450px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Brain size={120} />
                  </div>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                    Cognitive Performance Radar
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                        <Radar
                          name="Patient"
                          dataKey="score"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <StatCard icon={<Zap size={20}/>} label="Average RT" value={`${Math.round(results.reduce((a,b)=>a+b.metrics.averageReactionTime,0)/results.length)}ms`} color="blue" />
                   <StatCard icon={<CheckCircle size={20}/>} label="Global Accuracy" value={`${Math.round(results.reduce((a,b)=>a+b.metrics.accuracy,0)/results.length * 100)}%`} color="green" />
                   <StatCard icon={<XCircle size={20}/>} label="Total Errors" value={results.reduce((a,b)=>a+b.metrics.errorCount,0)} color="red" />
                </div>
              </div>

              {/* Insights Section */}
              <div className="space-y-8">
                <div className="bg-primary-600/10 rounded-[40px] p-10 border border-primary-500/20 min-h-[350px] flex flex-col relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-600/5 rounded-full blur-[40px]"></div>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-sm font-black text-primary-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></span>
                       AI Clinical Insights
                    </h3>
                    {!analysis && (
                      <button 
                        onClick={fetchAnalysis}
                        disabled={loadingAnalysis}
                        className="text-primary-500 font-black text-xs uppercase tracking-widest hover:text-primary-400 transition-colors flex items-center gap-2"
                      >
                        {loadingAnalysis ? 'Processing Neurons...' : 'Generate Neural Analysis'}
                        <Zap size={14} />
                      </button>
                    )}
                  </div>
                  
                  {analysis ? (
                    <div className="text-slate-200 leading-[1.8] text-lg font-medium h-full flex items-center italic relative z-10 px-4 border-l-2 border-primary-500/30">
                      "{analysis}"
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 italic text-center gap-4">
                      <Zap size={40} className="text-slate-800" />
                      <p className="max-w-[240px]">Neural engine dormant. Activate generation to extract cognitive markers.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-4">Detailed Laboratory Data</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {results.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-5 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:bg-slate-900 transition-colors">
                        <div className="font-bold text-slate-200 text-sm tracking-wide">{t.tests[r.testType]}</div>
                        <div className="flex gap-6 items-center">
                          <div className="text-right">
                             <div className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Precision</div>
                             <div className="text-green-400 font-mono text-sm">{Math.round(r.metrics.accuracy * 100)}%</div>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Latency</div>
                             <div className="text-blue-400 font-mono text-sm">{Math.round(r.metrics.averageReactionTime)}ms</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: 'blue' | 'green' | 'red' }) {
  const colors = {
    blue: 'bg-blue-600/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-600/10 text-green-400 border-green-500/20',
    red: 'bg-red-600/10 text-red-400 border-red-500/20'
  };
  return (
    <div className={`${colors[color]} p-6 rounded-[32px] text-center border overflow-hidden relative group`}>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-center mb-3 relative z-10">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 relative z-10">{label}</div>
      <div className="text-2xl font-black font-mono relative z-10">{value}</div>
    </div>
  );
}
