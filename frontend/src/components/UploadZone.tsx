import React from 'react';
import { Upload, Play, Microscope } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  file: File | null;
  previewUrl: string | null;
  loading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  onFileSelect, 
  onAnalyze, 
  file, 
  previewUrl, 
  loading 
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Microscope className="mr-2 text-blue-600" size={20} />
          Sample Acquisition
        </h2>
        {file && !loading && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
            IMAGE READY
          </span>
        )}
      </div>

      <div className="relative group transition-all">
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          disabled={loading}
        />
        
        <div className={`
          border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all
          ${previewUrl ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50 hover:border-blue-400'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg shadow-md object-contain" />
          ) : (
            <>
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Upload className="text-blue-600" size={32} />
              </div>
              <p className="text-slate-600 font-medium">Upload Thin Smear Image</p>
              <p className="text-slate-400 text-xs mt-1">Supports JPG, PNG</p>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={!file || loading}
        className={`
          w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center transition-all
          ${!file || loading 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-[0.98]'}
        `}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Agents Collaborating...
          </>
        ) : (
          <>
            <Play className="mr-2" size={18} fill="currentColor" />
            Start Research Analysis
          </>
        )}
      </button>
    </div>
  );
};