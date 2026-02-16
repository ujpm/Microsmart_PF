import React from 'react';
import { Microscope, UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (files: File[]) => void; // CHANGED to accept an array of files
  loading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  onFileSelect, 
  loading 
}) => {
  return (
    <div className="w-full max-w-2xl bg-slate-900/50 p-8 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-200 flex items-center">
          <Microscope className="mr-3 text-cyan-500" size={24} />
          Initialize Analysis Session
        </h2>
      </div>

      <div className="relative group transition-all">
        {/* Added 'multiple' and 'accept' attributes */}
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
             if (e.target.files && e.target.files.length > 0) {
               onFileSelect(Array.from(e.target.files));
             }
          }}
          disabled={loading}
        />
        
        <div className={`
          border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all
          ${loading ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900' : 'border-slate-600 bg-slate-900/80 hover:border-cyan-500 hover:bg-slate-800/80'}
        `}>
          <div className="bg-slate-950 p-5 rounded-full shadow-inner border border-slate-800 mb-6 group-hover:scale-110 transition-transform">
            <UploadCloud className="text-cyan-500" size={40} />
          </div>
          <p className="text-slate-300 font-bold text-lg mb-2">Drop up to 10 Thin Smear Images</p>
          <p className="text-slate-500 text-sm">Supports JPG, PNG formats</p>
        </div>
      </div>
    </div>
  );
};