import React from 'react';
import { Layers, Info } from 'lucide-react';
import { BRAND } from '../config';

interface NavbarProps {
  onHomeClick: () => void;
  onAnalysisClick?: () => void;
  onAboutClick?: () => void; // New Prop
  variant?: 'landing' | 'workbench';
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onHomeClick, 
  onAnalysisClick,
  onAboutClick 
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* BRAND IDENTITY */}
          <div 
            className="flex items-center cursor-pointer gap-3" 
            onClick={onHomeClick}
          >
            <img 
              src={BRAND.logos.primary} 
              alt="MicroSmart Logo" 
              className="h-8 w-auto brightness-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]"
            />
          </div>

          {/* NAVIGATION CONTROLS */}
          <div className="flex gap-6 items-center">
             {/* About Button */}
             <button 
                onClick={onAboutClick}
                className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
              >
                <Info size={16} />
                <span className="hidden sm:inline">About</span>
              </button>

              {/* Launch Button */}
              <button 
                onClick={onAnalysisClick}
                className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 px-4 py-2 rounded-full text-sm font-bold hover:bg-cyan-500/20 transition-all flex items-center shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]"
              >
                <Layers size={16} className="mr-2" />
                Launch Agent
              </button>
          </div>
        </div>
      </div>
    </nav>
  );
};