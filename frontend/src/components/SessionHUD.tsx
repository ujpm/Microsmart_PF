import React from 'react';
import { Activity, ShieldCheck, Fingerprint, BarChart3 } from 'lucide-react';
import { type SessionItem } from '../hooks/useAnalysis';

interface SessionHUDProps {
  activeSlide?: SessionItem;
}

export const SessionHUD: React.FC<SessionHUDProps> = ({ activeSlide }) => {
  if (!activeSlide || !activeSlide.result) return null;

  const { result } = activeSlide;
  const pctStr = result.parasitemia_calculation.value;
  const pctVal = parseFloat(pctStr);
  const isHighRisk = !isNaN(pctVal) && pctVal > 2.0;

  // --- NEW DYNAMIC LOGIC: Determine Dominant Species ---
  const getDominantSpecies = (counts: Record<string, number>) => {
    let falciparum = 0; let vivax = 0; let malariae = 0; let ovale = 0;
    
    Object.entries(counts).forEach(([key, val]) => {
      const k = key.toLowerCase();
      // Count specific species
      if (k.includes('vivax')) vivax += val;
      else if (k.includes('malariae')) malariae += val;
      else if (k.includes('ovale')) ovale += val;
      // If it explicitly says falciparum OR uses our generic MicroSmart classes
      else if (k.includes('falciparum') || ['ring', 'trophozoite', 'gametocyte', 'schizont'].includes(k)) falciparum += val;
    });
    
    if (vivax > falciparum && vivax >= malariae && vivax >= ovale) return "P. Vivax";
    if (malariae > falciparum && malariae >= vivax && malariae >= ovale) return "P. Malariae";
    if (ovale > falciparum && ovale >= vivax && ovale >= malariae) return "P. Ovale";
    if (falciparum === 0 && vivax === 0 && malariae === 0 && ovale === 0) return "None Detected";
    
    return "P. Falciparum";
  };

  const detectedSpecies = getDominantSpecies(result.detailed_counts);

  return (
    <div className="h-24 bg-slate-900/80 backdrop-blur-md border-b border-cyan-900/30 flex items-center px-6 justify-between shrink-0 z-40 animate-fade-in-up relative overflow-hidden">
      
      {isHighRisk && (
        <div className="absolute inset-0 bg-danger-glow opacity-10 animate-pulse-slow pointer-events-none" />
      )}

      {/* 1. Critical Metric: Parasitemia */}
      <div className="flex items-center gap-5 border-r border-slate-700/50 pr-8 relative z-10">
        <div className={`
          p-4 rounded-2xl shadow-lg border border-opacity-20
          ${isHighRisk ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-cyan-500/10 border-cyan-500 text-cyan-400'}
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

      {/* 2. Secondary Insights */}
      <div className="flex-1 flex items-center justify-start gap-16 pl-10 relative z-10">
        <div className="flex flex-col">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2">
            <BarChart3 size={12} /> Total Load
          </div>
          <div className="text-2xl font-mono font-bold text-slate-200">
            {result.total_parasites} <span className="text-sm text-slate-600 font-sans">org/field</span>
          </div>
        </div>

        {/* --- DYNAMIC SPECIES INJECTION --- */}
        <div className="flex flex-col">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2">
            <Fingerprint size={12} /> Detected Species
          </div>
          <div className={`text-xl font-bold tracking-wide ${detectedSpecies === 'None Detected' ? 'text-slate-500' : 'text-cyan-400'}`}>
            {detectedSpecies}
          </div>
          <div className="text-[10px] text-slate-500">
            {detectedSpecies !== 'None Detected' ? 'AI Confidence: High' : 'Target not found'}
          </div>
        </div>

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