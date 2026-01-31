import React from 'react';
import { Activity, ShieldCheck, Fingerprint, BarChart3 } from 'lucide-react';
import { type SessionItem } from '../hooks/useAnalysis';

interface SessionHUDProps {
  activeSlide?: SessionItem;
}

export const SessionHUD: React.FC<SessionHUDProps> = ({ activeSlide }) => {
  if (!activeSlide || !activeSlide.result) return null;

  const { result } = activeSlide;
  // Parse parasitemia value (remove % to check threshold)
  const pctStr = result.parasitemia_calculation.value;
  const pctVal = parseFloat(pctStr);
  
  // Logic: >2% is Severe Malaria (Rwandan Protocol)
  const isHighRisk = !isNaN(pctVal) && pctVal > 2.0;

  return (
    <div className="h-24 bg-slate-900/80 backdrop-blur-md border-b border-cyan-900/30 flex items-center px-6 justify-between shrink-0 z-40 animate-fade-in-up relative overflow-hidden">
      
      {/* Background Glow for High Risk */}
      {isHighRisk && (
        <div className="absolute inset-0 bg-danger-glow opacity-10 animate-pulse-slow pointer-events-none" />
      )}

      {/* 1. Critical Metric: Parasitemia */}
      <div className="flex items-center gap-5 border-r border-slate-700/50 pr-8 relative z-10">
        <div className={`
          p-4 rounded-2xl shadow-lg border border-opacity-20
          ${isHighRisk 
            ? 'bg-red-500/10 border-red-500 text-red-500' 
            : 'bg-cyan-500/10 border-cyan-500 text-cyan-400'}
        `}>
          <Activity size={32} strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">
            Parasitemia Level
          </div>
          <div className={`text-4xl font-black tracking-tight ${isHighRisk ? 'text-red-400' : 'text-slate-100'}`}>
            {pctStr}
          </div>
          {isHighRisk && (
            <div className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded inline-block mt-1">
              SEVERE PROTOCOL
            </div>
          )}
        </div>
      </div>

      {/* 2. Secondary Insights (The "Quick Look") */}
      <div className="flex-1 flex items-center justify-start gap-16 pl-10 relative z-10">
        
        {/* Total Count */}
        <div className="flex flex-col">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2">
            <BarChart3 size={12} /> Total Load
          </div>
          <div className="text-2xl font-mono font-bold text-slate-200">
            {result.total_parasites} <span className="text-sm text-slate-600 font-sans">org/field</span>
          </div>
        </div>

        {/* Species Detection */}
        <div className="flex flex-col">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2">
            <Fingerprint size={12} /> Detected Species
          </div>
          <div className="text-xl font-bold text-cyan-400 tracking-wide">
            P. falciparum
          </div>
          <div className="text-[10px] text-slate-500">Likelihood: High (Region: RW)</div>
        </div>

        {/* Quality/Confidence */}
        <div className="flex flex-col w-32">
           <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Scan Quality</div>
           <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> 
           </div>
           <div className="flex justify-between mt-1">
             <span className="text-[10px] text-emerald-500 font-bold">Optimal</span>
             <span className="text-[10px] text-slate-600">94%</span>
           </div>
        </div>
      </div>

      {/* 3. Status Badge */}
      <div className="hidden xl:flex items-center z-10">
         <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-400 flex items-center shadow-inner">
            <ShieldCheck size={16} className="mr-2 text-cyan-500" />
            MicroSmart Agent Active
         </div>
      </div>
    </div>
  );
};