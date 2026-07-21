import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  // Build a simple counts from predictions
  const counts: Record<string, number> = {};
  activeSlideData?.predictions?.forEach(p => {
    const key = p.class;
    counts[key] = (counts[key] || 0) + 1;
  });

  return (
    <div className={`
      relative bg-slate-900 border-l border-slate-800 flex flex-col h-full transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-12' : 'w-80 lg:w-[450px]'}
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
                
                {/* Minimal Counts from predictions */}
                {Object.keys(counts).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(counts).map(([className, val]) => {
                      let shortLabel = className.slice(0, 8);
                      return (
                        <div key={className} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center" title={className}>
                           <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate">
                             {shortLabel}
                           </span>
                           <span className="text-sm font-mono text-cyan-400">{val}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Report Area with Custom Styled Markdown */}
                <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                   {report ? (
                     <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        children={report.replace(/</g, '< ').replace(/>/g, '> ')} 
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold text-slate-100 mt-6 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-md font-bold text-cyan-400 mt-5 mb-2 uppercase tracking-wide text-[11px]" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1 text-slate-300" {...props} />,
                          li: ({node, ...props}) => <li className="pl-2" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-cyan-400" {...props} />,
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-4 rounded-lg border border-slate-700 shadow-xl bg-slate-950/50">
                               <table className="w-full text-left border-collapse" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-slate-800/80 border-b border-slate-700" {...props} />,
                          th: ({node, ...props}) => <th className="p-3 text-[10px] uppercase tracking-wider text-cyan-500 font-bold" {...props} />,
                          td: ({node, ...props}) => <td className="p-3 text-xs text-slate-300 border-b border-slate-800/50" {...props} />,
                          tr: ({node, ...props}) => <tr className="hover:bg-slate-800/50 transition-colors" {...props} />
                        }}
                     />
                   ) : (
                     <span className="italic opacity-50">Waiting for clinical assessment...</span>
                   )}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};