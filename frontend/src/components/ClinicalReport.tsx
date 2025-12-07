import React from 'react';
import { FileText, Activity } from 'lucide-react';

interface ClinicalReportProps {
  report: string | null;
}

export const ClinicalReport: React.FC<ClinicalReportProps> = ({ report }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-medical-900 mb-4 flex items-center">
        <FileText className="mr-2" size={20} />
        Clinical Assessment
      </h2>
      
      <div className="flex-1 bg-slate-50 rounded-lg p-6 border border-slate-100 overflow-auto min-h-[300px]">
        {!report ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
            <Activity size={48} className="mb-4" />
            <p>Awaiting scan data...</p>
          </div>
        ) : (
          <article className="prose prose-slate prose-sm max-w-none">
            <div className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
              {report}
            </div>
          </article>
        )}
      </div>
    </div>
  );
};