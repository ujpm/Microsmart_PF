import React, { useRef } from 'react';
import { Upload, FileImage, ShieldAlert } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div 
      className="max-w-2xl w-full mx-auto"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div 
        className={`
          relative group cursor-pointer
          bg-slate-900/50 hover:bg-slate-900/80 
          border-2 border-dashed border-slate-700 hover:border-cyan-500/50 
          rounded-3xl p-12 transition-all duration-300
          flex flex-col items-center text-center
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10">
          <Upload className="text-cyan-400" size={32} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
          Upload Slide Images
        </h2>
        
        <p className="text-slate-400 max-w-md mb-8 relative z-10">
          Drag & drop high-resolution thin blood smears here, or click to browse.
          Supports JPG/PNG (Max 20MB).
        </p>

        <div className="flex gap-4 relative z-10">
           <div className="flex items-center text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
             <FileImage size={12} className="mr-2" />
             .JPG, .PNG
           </div>
           <div className="flex items-center text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
             <ShieldAlert size={12} className="mr-2" />
             NO PHI
           </div>
        </div>

        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileInput}
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-600 text-xs">
          By uploading, you confirm these are research samples containing no Patient Health Information (PHI).
        </p>
      </div>
    </div>
  );
};