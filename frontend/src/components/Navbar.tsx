import React from 'react';
import { Beaker, Layers } from 'lucide-react';

interface NavbarProps {
  onHomeClick: () => void;
  onAnalysisClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onHomeClick, onAnalysisClick }) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={onHomeClick}
          >
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
              <Beaker className="text-white" size={24} />
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold text-slate-900 block leading-none">MicroSmart</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Family of Agents</span>
            </div>
          </div>

          <div className="flex gap-6">
            <button 
              onClick={onHomeClick}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Project Overview
            </button>
            <button 
              onClick={onAnalysisClick}
              className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-100 transition-all flex items-center"
            >
              <Layers size={16} className="mr-2" />
              Launch PF-Agent
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};