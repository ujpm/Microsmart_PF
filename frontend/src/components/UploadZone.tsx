import React, { useState } from 'react';
import { Microscope, UploadCloud, Server, Cloud } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (files: File[], engine: 'local' | 'cloud') => void; 
  loading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, loading }) => {
  const [engine, setEngine] = useState<'local' | 'cloud'>('local');

  return (
    <div className="w-full max-w-2xl bg-slate-900/50 p-8 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-200 flex items-center">
          <Microscope className="mr-3 text-cyan-500" size={24} />
          Initialize Session
        </h2>
        
        <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
           <button 
             onClick={() => setEngine('local')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${engine === 'local' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Server size={12} /> MicroSmart Model
           </button>
           <button 
             onClick={() => setEngine('cloud')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${engine === 'cloud' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Cloud size={12} /> Roboflow Model
           </button>
        </div>
      </div>

      <div className="relative group transition-all">
        <input
          type="file" multiple accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
             if (e.target.files && e.target.files.length > 0) {
               onFileSelect(Array.from(e.target.files), engine);
             }
          }}
          disabled={loading}
        />
        
        <div className={`
          border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all
          ${loading ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900' : 'border-slate-600 bg-slate-900/80 hover:border-cyan-500 hover:bg-slate-800/80'}
        `}>
          <div className="bg-slate-950 p-5 rounded-full shadow-inner border border-slate-800 mb-6 group-hover:scale-110 transition-transform">
            <UploadCloud className={engine === 'local' ? "text-cyan-500" : "text-purple-500"} size={40} />
          </div>
          <p className="text-slate-300 font-bold text-lg mb-2">Drop up to 10 Thin Smear Images</p>
          <p className="text-slate-500 text-sm">Will be processed via {engine === 'local' ? 'Local YOLOv8n Engine' : 'Cloud DiagMal Engine'}</p>
        </div>
      </div>
    </div>
  );
};