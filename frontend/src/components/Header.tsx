import React from 'react';
import { Microscope } from 'lucide-react';
import { BRAND } from '../config';

export const Header: React.FC = () => {
  return (
    <div className="w-full bg-slate-950/50 border-b border-slate-800/50 py-3 px-6 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-4">
        {/* Active Session Indicator */}
        <div className="h-8 w-1 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
        
        <div>
          {/* LOGO 3: Sub-Project Identity */}
          <img src={BRAND.logos.wordmark} alt="PF Agent" className="h-6 mb-1 opacity-90" />
          
          <p className="text-xs text-slate-400 flex items-center font-mono tracking-wide">
            <Microscope size={12} className="mr-1.5 text-cyan-500" />
            SESSION ACTIVE: P. FALCIPARUM MORPHOLOGY SCAN
          </p>
        </div>
      </div>
    </div>
  );
};