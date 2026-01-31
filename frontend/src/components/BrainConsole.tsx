import ReactMarkdown from 'react-markdown';

interface BrainConsoleProps {
  report: string | null;
  isProcessing: boolean;
  progressMsg: string;
}

export const BrainConsole = ({ report, isProcessing, progressMsg }: BrainConsoleProps) => {
  return (
    <div className="w-96 bg-slate-900 border-l border-slate-700 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-700 bg-slate-950 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <h2 className="text-sm font-bold text-slate-100 tracking-wider">BRAIN AGENT</h2>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
             <div className="w-2 h-12 bg-cyan-500/50 animate-pulse" />
             <p className="text-cyan-400 font-mono text-sm">{progressMsg}</p>
          </div>
        ) : report ? (
          <article className="prose prose-invert prose-sm prose-headings:text-cyan-400 prose-strong:text-slate-200">
            <ReactMarkdown>{report}</ReactMarkdown>
          </article>
        ) : (
          <div className="text-slate-600 text-center mt-20 italic">
            <p>Ready to analyze.</p>
            <p className="text-xs mt-2">Upload slides to initialize.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-950">
         <input 
           disabled={!report}
           placeholder="Ask Dr. AI a question..." 
           className="w-full bg-slate-800 text-slate-200 p-3 rounded-lg border border-slate-700 focus:border-cyan-500 outline-none text-sm"
         />
      </div>
    </div>
  );
};