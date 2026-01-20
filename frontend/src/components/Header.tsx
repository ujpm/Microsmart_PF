import React from 'react';
import { Microscope } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="col-span-full mb-2">
      <div className="flex items-center gap-3">
        <div className="h-10 w-1 bg-blue-600 rounded-full" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">PF-Agent Analysis Lab</h1>
          <p className="text-sm text-slate-500 flex items-center">
            <Microscope size={14} className="mr-1.5" />
            Active Research Session: Parasite Morphology & Quantification
          </p>
        </div>
      </div>
    </div>
  );
};