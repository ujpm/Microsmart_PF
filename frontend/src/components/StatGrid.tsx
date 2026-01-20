import React from 'react';
import { Microscope, Target, Info } from 'lucide-react';

interface StatGridProps {
  data: {
    Red_Blood_Cell: number;
    Leukocyte: number;
    Ring: number;
    Trophozoite: number;
    Gametocyte: number;
    Schizont: number;
    parasitemia_pct: number;
  };
}

export const StatGrid: React.FC<StatGridProps> = ({ data }) => {
  const metrics = [
    { label: 'Host Cells (RBC)', value: data.Red_Blood_Cell, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Immune Cells (WBC)', value: data.Leukocyte, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Ring Forms', value: data.Ring, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Trophozoites', value: data.Trophozoite, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Gametocytes', value: data.Gametocyte, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Target className="mr-2 text-blue-600" size={20} />
          Detection Metrics
        </h2>
        <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <Info size={12} className="mr-1" />
          Agent Output
        </div>
      </div>

      {/* Main Parasitemia Highlight */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-blue-100 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Computed Parasitemia</p>
          <div className="flex items-baseline">
            <span className="text-4xl font-black">{data.parasitemia_pct?.toFixed(4)}</span>
            <span className="ml-1 text-xl font-bold opacity-80">%</span>
          </div>
          <p className="mt-3 text-[10px] text-blue-100/70 leading-tight max-w-[200px]">
            Ratio of detected parasites to identified red blood cells in current field.
          </p>
        </div>
        <Microscope className="absolute -right-4 -bottom-4 text-white/10" size={120} />
      </div>

      {/* Grid of Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={`${metric.bg} p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase truncate mb-1">{metric.label}</p>
            <p className={`text-xl font-black ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};