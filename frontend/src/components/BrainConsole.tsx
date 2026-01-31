import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, MessageSquare, ChevronDown, ChevronUp, AlertCircle, Microscope } from 'lucide-react';
import { type VisionResult } from '../hooks/useAnalysis';

interface BrainConsoleProps {
  report: string | null;
  isProcessing: boolean;
  progressMsg: string;
  activeSlideData?: VisionResult | null;
}

export const BrainConsole: React.FC<BrainConsoleProps> = ({ 
  report, 
  isProcessing, 
  progressMsg,
  activeSlideData 
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Auto-scroll to bottom of report when it arrives
  const reportRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollTop = 0;
    }
  }, [report]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-l border-slate-800 shadow-2xl">
      
      {/* HEADER */}
      <div className="h-14 shrink-0 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Bot size={18} />
          <span className="font-bold tracking-wider text-sm">BRAIN AGENT</span>
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase">Llama-3.3-70b</div>
      </div>
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        
        {isProcessing ? (
          // PROCESSING STATE
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
             <div className="relative">
               <div className="w-16 h-16 border-4 border-slate-800 rounded-full" />
               <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-cyan-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
               <Microscope className="absolute inset-0 m-auto text-cyan-500 animate-pulse" size={24} />
             </div>
             <div>
               <p className="text-cyan-400 font-bold animate-pulse">{progressMsg}</p>
               <p className="text-slate-500 text-xs mt-2">Integrating Vision Data...</p>
             </div>
          </div>
        ) : !activeSlideData ? (
          // IDLE STATE
          <div className="flex flex-col items-center justify-center h-full text-slate-600 p-8 text-center opacity-60">
            <Bot size={48} className="mb-4" />
            <p>Select a slide to view analysis.</p>
          </div>
        ) : (
          // DATA DISPLAY STATE
          <div className="p-5 space-y-6">
            
            {/* 1. DETAILED COUNTS (Merged from StatGrid) */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                <Microscope size={12} className="mr-2" /> 
                Cellular Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['Ring', 'Trophozoite', 'Gametocyte', 'Schizont'].map((stage) => (
                  <div key={stage} className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase truncate">{stage}</div>
                    <div className={`text-lg font-mono font-bold ${activeSlideData.detailed_counts[stage] > 0 ? 'text-cyan-300' : 'text-slate-600'}`}>
                      {activeSlideData.detailed_counts[stage] || 0}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between">
                <div className="text-xs text-slate-500">WBC Count</div>
                <div className="text-xs font-mono text-purple-400">{activeSlideData.detailed_counts['Leukocyte'] || 0}</div>
              </div>
            </div>

            {/* 2. CLINICAL REPORT */}
            <div className="prose prose-invert prose-sm prose-p:text-slate-300 prose-headings:text-cyan-400 leading-relaxed" ref={reportRef}>
               {report ? (
                 <ReactMarkdown>{report}</ReactMarkdown>
               ) : (
                 <div className="flex items-center gap-2 text-yellow-500/80 text-xs bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                   <AlertCircle size={16} />
                   <span>Waiting for Final Clinical Assessment...</span>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: CHAT INTERFACE */}
      <div className="border-t border-slate-800 bg-slate-900 p-4 shrink-0 z-20">
        {!chatOpen ? (
          <button 
            onClick={() => setChatOpen(true)}
            disabled={!report}
            className="w-full py-3 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-900/50 text-cyan-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare size={16} />
            Consult Brain Agent
          </button>
        ) : (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Consultation Mode</span>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-slate-300">
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="relative">
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about this diagnosis..." 
                className="w-full bg-slate-950 text-slate-200 p-3 pr-10 rounded-xl border border-slate-700 focus:border-cyan-500 outline-none text-sm shadow-inner"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && setQuery('')} // Mock send
              />
              <button className="absolute right-2 top-2 p-1 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500 transition-colors">
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};