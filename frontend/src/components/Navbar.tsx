import React from 'react';
import { Layers, ArrowLeft } from 'lucide-react';
import { BRAND } from '../config'; // Using the Brand Kit

interface NavbarProps {
  onHomeClick: () => void;
  onAnalysisClick?: () => void;
  variant?: 'landing' | 'workbench';
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onHomeClick, 
  onAnalysisClick, 
  variant = 'landing' 
}) => {
  const isDark = variant === 'workbench';

  return (
    <nav className={`border-b transition-colors duration-300 sticky top-0 z-50 ${
      isDark 
        ? 'bg-slate-900 border-cyan-900/30 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* BRAND IDENTITY: Logo 2 */}
          <div 
            className="flex items-center cursor-pointer gap-3" 
            onClick={onHomeClick}
          >
            <img 
              src={BRAND.logos.primary} 
              alt="MicroSmart Logo" 
              // In dark mode, we add a subtle glow and brightness boost so the logo pops
              className={`h-8 w-auto transition-all ${isDark ? 'brightness-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]' : ''}`}
            />
          </div>

          {/* NAVIGATION CONTROLS */}
          <div className="flex gap-6 items-center">
            {isDark ? (
               <button 
               onClick={onHomeClick}
               className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
             >
               <ArrowLeft size={14} /> Exit Session
             </button>
            ) : (
              <>
                <button 
                  onClick={onHomeClick}
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={onAnalysisClick}
                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-100 transition-all flex items-center shadow-sm"
                >
                  <Layers size={16} className="mr-2" />
                  Launch PF-Agent
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};