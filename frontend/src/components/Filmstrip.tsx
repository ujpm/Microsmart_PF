import { useRef } from 'react';
import { type SessionItem } from '../hooks/useAnalysis';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';

interface FilmstripProps {
  session: SessionItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddFiles: (files: File[]) => void; // New Prop
  onDeleteSlide: (id: string) => void; // New Prop
}

export const Filmstrip = ({ 
  session, selectedIndex, onSelect, isCollapsed, onToggle, onAddFiles, onDeleteSlide 
}: FilmstripProps) => {
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className={`
      relative bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300 ease-in-out shrink-0
      ${isCollapsed ? 'w-12' : 'w-64'}
    `}>
      
      {/* Header with Add Button */}
      <div className="h-10 border-b border-slate-800 flex items-center justify-between px-2 shrink-0 bg-slate-900/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-400 tracking-wider">SLIDES</span>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-1 rounded bg-cyan-900/30 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"
               title="Add more slides"
             >
               <Plus size={12} />
             </button>
             {/* Hidden Input for Add Button */}
             <input 
               type="file" multiple accept="image/*" 
               className="hidden" ref={fileInputRef} onChange={handleFileChange} 
             />
          </div>
        )}
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-cyan-400 transition-colors ml-auto"
        >
          <ChevronLeft size={14} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {session.map((item, idx) => {
          const isSelected = selectedIndex === idx;
          const hasParasites = (item.result?.total_parasites || 0) > 0;
          
          return (
            <div 
              key={item.id}
              onClick={() => onSelect(idx)}
              className={`
                group relative cursor-pointer transition-all border-l-2
                ${isCollapsed ? 'p-2 flex justify-center' : 'p-3 border-b border-slate-800/50'}
                ${isSelected 
                  ? 'bg-cyan-900/10 border-cyan-500' 
                  : 'hover:bg-slate-800/50 border-transparent hover:border-slate-600'}
              `}
            >
              {isCollapsed ? (
                // Collapsed View
                <div className={`
                  w-3 h-3 rounded-full 
                  ${item.status === 'processing' ? 'bg-cyan-500 animate-pulse' : ''}
                  ${item.status === 'done' ? (hasParasites ? 'bg-red-500' : 'bg-emerald-500') : ''}
                  ${item.status === 'pending' ? 'bg-slate-700' : ''}
                `} />
              ) : (
                // Expanded View
                <div className="pr-4"> {/* Padding for Trash icon */}
                   <div className="flex justify-between items-center mb-1">
                     <span className={`text-[10px] font-mono ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                       #{idx + 1}
                     </span>
                     {item.status === 'done' && (
                       <div className={`w-2 h-2 rounded-full ${hasParasites ? 'bg-red-500' : 'bg-emerald-500'}`} />
                     )}
                   </div>
                   <div className="text-xs text-slate-300 font-medium truncate">
                     {item.originalFile.name}
                   </div>

                   {/* Delete Button (Visible on Hover) */}
                   <button 
                     onClick={(e) => {
                       e.stopPropagation(); // Don't select the slide when deleting
                       onDeleteSlide(item.id);
                     }}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                     title="Remove Slide"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};