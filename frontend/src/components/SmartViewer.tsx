import { useState } from 'react';
import { type SessionItem } from '../hooks/useAnalysis';

interface SmartViewerProps {
  activeSlide?: SessionItem;
}

export const SmartViewer = ({ activeSlide }: SmartViewerProps) => {
  const [showOriginal, setShowOriginal] = useState(false);

  // 1. Prepare API Base URL
  const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const API_URL = rawApiUrl.replace(/\/$/, ""); 

  if (!activeSlide) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center text-slate-600">
        <div className="text-center">
          <p className="text-4xl mb-2">🔭</p>
          <p>Select a slide to inspect</p>
        </div>
      </div>
    );
  }

// 2. Construct Source URL
  // We read the raw Base64 string sent directly from the Vision Agent
  const aiImageSrc = activeSlide.result 
    ? `data:image/jpeg;base64,${activeSlide.result.annotated_image}` 
    : null;
    
  const rawImageSrc = URL.createObjectURL(activeSlide.originalFile);
  
  const isAiReady = !!aiImageSrc;
  const displaySrc = (showOriginal || !isAiReady) ? rawImageSrc : aiImageSrc;

  return (
    <div className="flex-1 bg-black flex flex-col relative overflow-hidden h-full">
      <div className="h-14 bg-slate-900 border-b border-slate-700 flex justify-between items-center px-6 shrink-0 z-10">
        <div className="flex flex-col">
           <span className="font-mono text-sm text-slate-400">FILENAME</span>
           <span className="text-slate-200 font-medium truncate max-w-md">{activeSlide.originalFile.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${!showOriginal ? 'text-cyan-400' : 'text-slate-600'}`}>AI VIEW</span>
            
            <button 
                onClick={() => setShowOriginal(!showOriginal)}
                disabled={!isAiReady}
                className={`
                    relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none
                    ${showOriginal ? 'bg-slate-600' : 'bg-cyan-600'}
                    ${!isAiReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <span 
                    className={`
                        absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                        ${showOriginal ? 'translate-x-6' : 'translate-x-0'}
                    `} 
                />
            </button>
            
            <span className={`text-xs font-bold ${showOriginal ? 'text-white' : 'text-slate-600'}`}>RAW</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative bg-dots-pattern">
         {activeSlide.status === 'processing' && (
           <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
             <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
             <div className="text-cyan-400 font-mono tracking-widest animate-pulse">SCANNING CELLULAR STRUCTURE...</div>
           </div>
         )}
         
         <img 
           src={displaySrc || undefined} 
           alt="Microscope Slide" 
           className="max-h-full max-w-full object-contain shadow-2xl border border-slate-800"
         />
      </div>
    </div>
  );
};