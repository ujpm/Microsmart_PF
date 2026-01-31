import { useState } from 'react';
import { type SessionItem } from '../hooks/useAnalysis';

interface SmartViewerProps {
  activeSlide?: SessionItem;
}

export const SmartViewer = ({ activeSlide }: SmartViewerProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  if (!activeSlide) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center text-slate-600">
        <div className="text-center">
          <p className="text-4xl mb-4 opacity-50">🔭</p>
          <p className="tracking-widest text-xs font-bold uppercase">Select a slide to inspect</p>
        </div>
      </div>
    );
  }

  // FIX: Construct full URL for backend image
  const aiImageSrc = activeSlide.result?.image_url 
    ? `${API_URL}${activeSlide.result.image_url}` 
    : null;
    
  const rawImageSrc = URL.createObjectURL(activeSlide.originalFile);
  
  const isAiReady = !!aiImageSrc;
  const displaySrc = (showOriginal || !isAiReady) ? rawImageSrc : aiImageSrc;

  return (
    <div className="flex-1 bg-black flex flex-col relative overflow-hidden h-full group">
      {/* Header Overlay (Fade out on hover for better view) */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pt-4 px-6 z-20 transition-opacity duration-300 opacity-100 group-hover:opacity-0 hover:!opacity-100">
        <div className="flex flex-col">
           <span className="font-mono text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Active Specimen</span>
           <span className="text-slate-200 text-sm font-medium truncate max-w-md drop-shadow-md">{activeSlide.originalFile.name}</span>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur rounded-full px-3 py-1 border border-white/10">
            <span className={`text-[10px] font-bold ${!showOriginal ? 'text-cyan-400' : 'text-slate-500'}`}>AI</span>
            
            <button 
                onClick={() => setShowOriginal(!showOriginal)}
                disabled={!isAiReady}
                className={`
                    relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out focus:outline-none
                    ${showOriginal ? 'bg-slate-600' : 'bg-cyan-600'}
                    ${!isAiReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <span 
                    className={`
                        absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200
                        ${showOriginal ? 'translate-x-5' : 'translate-x-0'}
                    `} 
                />
            </button>
            
            <span className={`text-[10px] font-bold ${showOriginal ? 'text-white' : 'text-slate-500'}`}>RAW</span>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 flex items-center justify-center relative bg-dots-pattern w-full h-full p-4">
         {activeSlide.status === 'processing' && (
           <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center backdrop-blur-sm">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-800 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-cyan-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
             </div>
             <div className="mt-4 text-cyan-400 font-mono text-xs tracking-[0.2em] animate-pulse">ANALYZING MORPHOLOGY</div>
           </div>
         )}
         
         <img 
           src={displaySrc || ''} 
           alt="Microscope Slide" 
           className="max-h-full max-w-full object-contain shadow-2xl border border-slate-800/50"
         />
      </div>
    </div>
  );
};