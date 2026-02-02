import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, ChevronRight, Microscope } from 'lucide-react';
import { type VisionResult } from '../hooks/useAnalysis';

interface BrainConsoleProps {
  report: string | null;
  isProcessing: boolean;
  progressMsg: string;
  activeSlideData?: VisionResult | null;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const BrainConsole: React.FC<BrainConsoleProps> = ({ 
  report, isProcessing, progressMsg, activeSlideData, isCollapsed, onToggle 
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report && reportRef.current) reportRef.current.scrollTop = 0;
  }, [report]);

  return (
    <div className={`
      relative bg-slate-900 border-l border-slate-800 flex flex-col h-full transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-12' : 'w-80 lg:w-96'}
    `}>
       {/* Header */}
       <div className="h-10 border-b border-slate-800 flex items-center justify-between px-3 shrink-0 bg-slate-900/50">
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ChevronRight size={14} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-cyan-400">
             <Bot size={14} />
             <span className="text-xs font-bold tracking-wider">BRAIN AGENT</span>
          </div>
        )}
      </div>

      {/* Collapsed State Icon */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center pt-4 gap-4">
           <Bot size={20} className="text-slate-600" />
           <div className="w-[1px] h-20 bg-slate-800" />
        </div>
      )}

      {/* Expanded Content */}
      <div className={`flex-1 overflow-hidden flex flex-col ${isCollapsed ? 'hidden' : 'flex'}`}>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4" ref={reportRef}>
           {isProcessing ? (
             <div className="text-center py-10 space-y-4">
                <Microscope className="mx-auto text-cyan-500 animate-pulse" size={32} />
                <p className="text-xs text-cyan-400 font-mono animate-pulse">{progressMsg}</p>
             </div>
           ) : !activeSlideData ? (
             <div className="text-center py-10 text-slate-600 text-xs">
                No data loaded.
             </div>
           ) : (
             <div className="space-y-6">
                {/* Minimal Counts for the side panel */}
                <div className="grid grid-cols-2 gap-2">
                   {Object.entries(activeSlideData.detailed_counts).map(([key, val]) => (
                      <div key={key} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                         <span className="text-[10px] text-slate-500 uppercase">{key.slice(0,3)}</span>
                         <span className="text-sm font-mono text-cyan-400">{val}</span>
                      </div>
                   ))}
                </div>
                
                {/* Report Area */}
                <div className="prose prose-invert prose-xs">
                   {report ? <ReactMarkdown>{report}</ReactMarkdown> : <span className="italic opacity-50">Waiting for clinical assessment...</span>}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};