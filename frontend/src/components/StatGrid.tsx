import React from 'react';
import { Microscope, Target, Info } from 'lucide-react';

interface StatGridProps {
  data: Record<string, number>;
  parasitemia_pct?: number | string; // Made flexible for both raw floats or string "1.5%"
}

export const StatGrid: React.FC<StatGridProps> = ({ data, parasitemia_pct }) => {
  
  // --- NEW DYNAMIC MAPPING LOGIC ---
  const formatMetrics = (counts: Record<string, number>) => {
    return Object.entries(counts).map(([key, value]) => {
      // Assign dynamic colors based on string contents
      let color = 'text-slate-600';
      let bg = 'bg-slate-50';
      
      const k = key.toLowerCase();
      if (k.includes('rbc') || k.includes('cell')) { color = 'text-red-600'; bg = 'bg-red-50'; }
      else if (k.includes('wbc')) { color = 'text-slate-600'; bg = 'bg-slate-100'; }
      else if (k.includes('falciparum')) { color = 'text-yellow-600'; bg = 'bg-yellow-50'; }
      else if (k.includes('vivax')) { color = 'text-emerald-600'; bg = 'bg-emerald-50'; }
      else if (k.includes('malariae')) { color = 'text-blue-600'; bg = 'bg-blue-50'; }
      else if (k.includes('ovale')) { color = 'text-orange-600'; bg = 'bg-orange-50'; }
      // Fallback for generic traditional MicroSmart classes
      else { color = 'text-indigo-600'; bg = 'bg-indigo-50'; }

      return { label: key, value, color, bg };
    });
  };

  const metrics = formatMetrics(data);
  const parsedPct = typeof parasitemia_pct === 'string' ? parseFloat(parasitemia_pct) : parasitemia_pct;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Target className="mr-2 text-blue-600" size={20} />
          Detection Metrics
        </h2>
        <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <Info size={12} className="mr-1" />
          Dynamic Agent Output
        </div>
      </div>

      <div className="mb-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-blue-100 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Computed Parasitemia</p>
          <div className="flex items-baseline">
            <span className="text-4xl font-black">{!isNaN(parsedPct as number) ? parsedPct?.toFixed(4) : "N/A"}</span>
            <span className="ml-1 text-xl font-bold opacity-80">{!isNaN(parsedPct as number) ? '%' : ''}</span>
          </div>
          <p className="mt-3 text-[10px] text-blue-100/70 leading-tight max-w-[200px]">
            Ratio of detected parasites to identified red blood cells in current field.
          </p>
        </div>
        <Microscope className="absolute -right-4 -bottom-4 text-white/10" size={120} />
      </div>

      {/* Dynamically renders whatever grid items the backend sent */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={`${metric.bg} p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase truncate mb-1" title={metric.label}>{metric.label}</p>
            <p className={`text-xl font-black ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};