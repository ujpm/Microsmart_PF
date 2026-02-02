import React from 'react';
import { Power } from 'lucide-react';
import { BRAND } from '../config';

interface WorkbenchHeaderProps {
  onEndSession: () => void;
}

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({ onEndSession }) => {
  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 relative z-50">
      
      {/* LEFT: Branding + Context */}
      <div className="flex items-center gap-6">
        {/* Glow Container */}
        <div className="relative group">
           <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
           <img 
             src={BRAND.logos.wordmark} 
             alt="MicroSmart" 
             className="h-8 w-auto relative z-10 brightness-110 drop-shadow-md"
           />
        </div>

        {/* The Inline Status Text */}
        <div className="hidden md:flex flex-col justify-center border-l border-slate-800 pl-6 h-8">
           <span className="text-[10px] font-black tracking-[0.2em] text-cyan-500 uppercase">
             Session Active
           </span>
           <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
             P. Falciparum Morphology Scan
           </span>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <button 
        onClick={onEndSession}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-wide group"
      >
        <span>End Session</span>
        <Power size={14} className="group-hover:scale-110 transition-transform" />
      </button>

    </header>
  );
};