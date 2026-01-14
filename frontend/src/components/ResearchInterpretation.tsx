import React from 'react';
import { BrainCircuit, Activity } from 'lucide-react';

interface ResearchInterpretationProps {
  report: string | null;
}

export const ResearchInterpretation: React.FC<ResearchInterpretationProps> = ({ report }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <BrainCircuit className="mr-2 text-purple-600" size={20} />
          Agent Reasoning
        </h2>
        <span className="text-[10px] font-black text-purple-600 border border-purple-200 px-2 py-0.5 rounded uppercase">
          Cerebras Llama-3.3
        </span>
      </div>
      
      <div className="flex-1 bg-slate-50/50 rounded-xl p-6 border border-slate-100 overflow-auto min-h-[400px]">
        {!report ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-10">
            <Activity size={48} className="mb-4 opacity-20 animate-pulse" />
            <p className="font-medium">Awaiting analysis from The Eye...</p>
            <p className="text-xs mt-2 leading-relaxed">
              Once detection is complete, The Brain will interpret the data to generate a research summary.
            </p>
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