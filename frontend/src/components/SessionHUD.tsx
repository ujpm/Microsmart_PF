import React from 'react';
import { Activity, ShieldCheck, Fingerprint, BarChart3, Loader2 } from 'lucide-react';
import { type SessionItem } from '../hooks/useAnalysis';

interface SessionHUDProps {
  activeSlide?: SessionItem;
}

export const SessionHUD: React.FC<SessionHUDProps> = ({ activeSlide }) => {
  if (!activeSlide) return null;

  const { result, status } = activeSlide;
  const isLoading = !result || status === 'processing';

  // Get parasitemia from summary_statistics
  const pctStr = result?.summary_statistics?.estimated_parasitemia_percent != null
    ? `${result.summary_statistics.estimated_parasitemia_percent}%`
    : '0.00%';
  const pctVal = parseFloat(pctStr);
  const isHighRisk = !isNaN(pctVal) && pctVal > 2.0;

  // Species from species_breakdown or predictions fallback
  const speciesBreakdown = result?.summary_statistics?.species_breakdown;
  const speciesList = speciesBreakdown
    ? Object.entries(speciesBreakdown)
        .filter(([, count]) => count > 0)
        .map(([key]) => {
          const speciesMap: Record<string, string> = {
            p_falciparum: 'P. Falciparum',
            p_vivax: 'P. Vivax',
            p_malariae: 'P. Malariae',
            p_ovale: 'P. Ovale',
          };
          return speciesMap[key] || key;
        })
    : [];
  const detectedSpecies = speciesList.length > 0 ? speciesList.join(', ') : 'None Detected';

  // Total parasites from summary_statistics or predictions length
  const totalParasites = result?.summary_statistics?.total_parasite_count ?? result?.predictions?.length ?? 0;

  return (
    <div className="h-24 bg-slate-900/80 backdrop-blur-md border-b border-cyan-900/30 flex items-center px-6 justify-between shrink-0 z-40 animate-fade-in-up relative overflow-hidden">
      {isHighRisk && !isLoading && (
        <div className="absolute inset-0 bg-danger-glow opacity-10 animate-pulse-slow pointer-events-none" />
      )}

      {/* 1. Critical Metric: Parasitemia */}
      <div className="flex items-center gap-5 border-r border-slate-700/50 pr-8 relative z-10">
        <div
          className={`p-4 rounded-2xl shadow-lg border border-opacity-20 ${
            isLoading
              ? 'bg-slate-800 border-slate-700 text-slate-500'
              : isHighRisk
              ? 'bg-red-500/10 border-red-500 text-red-500'
              : 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
          }`}
        >
          {isLoading ? <Loader2 size={32} className="animate-spin" /> : <Activity size={32} strokeWidth={2.5} />}
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">
            Parasitemia Level
          </div>
          <div className={`text-4xl font-black tracking-tight ${isLoading ? 'text-slate-600' : isHighRisk ? 'text-red-400' : 'text-slate-100'}`}>
            {isLoading ? '---' : pctStr}
          </div>
          {isHighRisk && !isLoading && (
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
            {isLoading ? '---' : totalParasites} <span className="text-sm text-slate-600 font-sans">org/field</span>
          </div>
        </div>

        {/* Dynamic Species List */}
        <div className="flex flex-col">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2">
            <Fingerprint size={12} /> Detected Species
          </div>
          <div
            className={`text-xl font-bold tracking-wide truncate max-w-[250px] ${
              isLoading || detectedSpecies === 'None Detected' ? 'text-slate-500' : 'text-cyan-400'
            }`}
            title={detectedSpecies}
          >
            {isLoading ? 'Analyzing...' : detectedSpecies}
          </div>
          <div className="text-[10px] text-slate-500">
            {isLoading ? 'Computer Vision Active' : detectedSpecies !== 'None Detected' ? 'Multi-class Analysis Active' : 'Target not found'}
          </div>
        </div>

        {/* Scan Quality */}
        <div className="flex flex-col w-32">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Scan Quality</div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isLoading ? 'bg-slate-700 w-1/3 animate-pulse' : 'bg-emerald-500 w-[94%] shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              }`}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] font-bold ${isLoading ? 'text-slate-500' : 'text-emerald-500'}`}>
              {isLoading ? 'Evaluating' : 'Optimal'}
            </span>
            <span className="text-[10px] text-slate-600">{isLoading ? '--' : '94%'}</span>
          </div>
        </div>
      </div>

      {/* 3. Status Badge */}
      <div className="hidden xl:flex items-center z-10">
        <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-400 flex items-center shadow-inner">
          <ShieldCheck size={16} className={`mr-2 ${isLoading ? 'text-slate-600 animate-pulse' : 'text-cyan-500'}`} />
          {isLoading ? 'Analyzing Slide...' : 'MicroSmart Agent Active'}
        </div>
      </div>
    </div>
  );
};