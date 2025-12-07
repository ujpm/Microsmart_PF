import React from 'react';
import { UploadCloud } from 'lucide-react';

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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
      <h2 className="text-lg font-semibold text-medical-900 mb-4 flex items-center">
        <UploadCloud className="mr-2" size={20} />
        Sample Acquisition
      </h2>

      {/* Drop Zone */}
      <div className="border-2 border-dashed border-medical-200 rounded-xl p-8 text-center hover:bg-medical-50 transition-colors relative min-h-[200px] flex flex-col justify-center">
        <input 
          type="file" 
          onChange={handleChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept="image/*"
        />
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Blood Smear" 
            className="max-h-64 mx-auto rounded-md shadow-md object-contain relative z-20 pointer-events-none" 
          />
        ) : (
          <div className="text-slate-400">
            <p>Drag & drop blood smear image here</p>
            <p className="text-xs mt-2">Supports JPG, PNG (Giemsa Stain)</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={onAnalyze}
        disabled={!file || loading}
        className={`w-full mt-6 py-3 rounded-lg font-semibold text-white transition-all flex justify-center items-center ${
          !file || loading 
            ? 'bg-slate-300 cursor-not-allowed' 
            : 'bg-medical-600 hover:bg-medical-700 shadow-md hover:shadow-lg'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Swarm...
          </>
        ) : "Run Diagnostics"}
      </button>
    </div>
  );
};