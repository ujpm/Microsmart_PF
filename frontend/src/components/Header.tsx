import React from 'react';
import { Microscope } from 'lucide-react';

export const Header: React.FC = () => (
  <header className="bg-white border-b border-medical-100 px-6 py-4 flex items-center shadow-sm">
    <div className="bg-medical-500 p-2 rounded-lg text-white mr-3">
      <Microscope size={24} />
    </div>
    <div>
      <h1 className="text-xl font-bold text-medical-900">MicroSmart PF</h1>
      <p className="text-xs text-slate-500 font-medium tracking-wider">AUTONOMOUS MALARIA AGENT</p>
    </div>
  </header>
);