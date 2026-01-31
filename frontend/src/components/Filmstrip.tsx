// FIX: Added 'type' keyword
import { type SessionItem } from '../hooks/useAnalysis';

interface FilmstripProps {
  session: SessionItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const Filmstrip = ({ session, selectedIndex, onSelect }: FilmstripProps) => {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full overflow-y-auto shrink-0">
      <div className="p-4 border-b border-slate-700 font-bold text-slate-300 flex justify-between items-center">
        <span>SLIDES</span>
        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{session.length}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {session.map((item, idx) => {
          const parasiteCount = item.result?.total_parasites ?? 0;
          const isSelected = selectedIndex === idx;
          
          return (
            <div 
              key={item.id}
              onClick={() => onSelect(idx)}
              className={`
                group p-3 border-b border-slate-800 cursor-pointer transition-all
                ${isSelected ? 'bg-cyan-900/20 border-l-4 border-cyan-400' : 'hover:bg-slate-800 border-l-4 border-transparent'}
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-mono ${isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  SLIDE {idx + 1}
                </span>
                
                {item.status === 'processing' && <span className="animate-pulse text-xs text-cyan-500 font-bold">SCANNING</span>}
                {item.status === 'done' && (
                   <div className={`w-2 h-2 rounded-full ${parasiteCount > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-emerald-500'}`} />
                )}
              </div>

              <div className="text-sm text-slate-300 font-medium">
                {item.status === 'pending' && <span className="text-slate-600 italic">Queued</span>}
                {item.status === 'processing' && <span className="text-slate-400">Analyzing...</span>}
                {item.status === 'done' && (
                  <span>{parasiteCount > 0 ? `${parasiteCount} Parasites` : 'No Parasites'}</span>
                )}
                {item.status === 'error' && <span className="text-red-400">Analysis Failed</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};