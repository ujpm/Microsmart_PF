import React from 'react';

interface StatGridProps {
  data: {
    parasitemia_pct: number;
    counts: Record<string, number>;
  };
}

const StatCard: React.FC<{ label: string; value: string | number; colorClass?: string }> = ({ label, value, colorClass = "text-slate-700" }) => (
  <div className="bg-medical-50 p-3 rounded-lg text-center border border-medical-100">
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

export const StatGrid: React.FC<StatGridProps> = ({ data }) => {
  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      <StatCard 
        label="Parasitemia" 
        value={`${data.parasitemia_pct}%`} 
        colorClass="text-red-600"
      />
      <StatCard 
        label="RBC Count" 
        value={data.counts.Red_Blood_Cell || 0} 
      />
      <StatCard 
        label="WBC Count" 
        value={data.counts.Leukocyte || 0} 
      />
    </div>
  );
};