import { useState, useEffect } from 'react';
import { type SessionItem } from '../hooks/useAnalysis';
import { API_CONFIG } from '../config';

interface SmartViewerProps {
  activeSlide?: SessionItem;
}

export const SmartViewer = ({ activeSlide }: SmartViewerProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [safeRawUrl, setSafeRawUrl] = useState<string | null>(null);

  // 1. Memory Leak Protection
  useEffect(() => {
    if (!activeSlide?.originalFile) {
      setSafeRawUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(activeSlide.originalFile);
    setSafeRawUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [activeSlide]);

  // 2. Keyboard Shortcut: SPACEBAR
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle if Space is pressed AND we have a slide
      if (e.code === 'Space' && activeSlide) {
        e.preventDefault(); // Prevent page scrolling
        setShowOriginal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide]);


  if (!activeSlide) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center text-slate-600 border-x border-slate-800">
        <div className="text-center">
          <p className="text-4xl mb-4 opacity-50">🔭</p>
          <p className="tracking-widest text-xs font-bold uppercase">Select a slide</p>
        </div>
      </div>
    );
  }

  const aiImageSrc = activeSlide.result?.image_url 
    ? `${API_CONFIG.baseUrl}${activeSlide.result.image_url}` 
    : null;
    
  const isAiReady = !!aiImageSrc;
  const displaySrc = (showOriginal || !isAiReady) ? safeRawUrl : aiImageSrc;

  return (
    <div className="flex-1 bg-black flex flex-col relative overflow-hidden h-full border-x border-slate-800">
      
      {/* SOLID HEADER (No Overlay) */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex justify-between items-center px-4 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0">Specimen:</span>
           <span className="text-xs text-slate-300 font-mono truncate">{activeSlide.originalFile.name}</span>
        </div>

        {/* CONTROLS: Visual Toggle + Spacebar Hint */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-600 font-mono hidden xl:inline-block">
             [SPACE] to toggle
          </span>

          <div className="flex items-center gap-2 bg-slate-950 rounded-full px-2 py-0.5 border border-slate-800">
             <span className={`text-[10px] font-bold ${!showOriginal ? 'text-cyan-400' : 'text-slate-600'}`}>AI</span>
             
             <button 
                 onClick={() => setShowOriginal(!showOriginal)}
                 disabled={!isAiReady}
                 className={`
                     relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out focus:outline-none
                     ${showOriginal ? 'bg-slate-700' : 'bg-cyan-600'}
                     ${!isAiReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                 `}
             >
                 <span 
                     className={`
                         absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200
                         ${showOriginal ? 'translate-x-4' : 'translate-x-0'}
                     `} 
                 />
             </button>
             
             <span className={`text-[10px] font-bold ${showOriginal ? 'text-white' : 'text-slate-600'}`}>RAW</span>
          </div>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 flex items-center justify-center relative bg-dots-pattern w-full h-full p-4 overflow-hidden">
         {activeSlide.status === 'processing' && (
           <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center backdrop-blur-sm">
             <div className="w-12 h-12 border-4 border-slate-800 rounded-full border-t-cyan-500 animate-spin" />
             <div className="mt-4 text-cyan-500 font-mono text-xs tracking-[0.2em] animate-pulse">PROCESSING</div>
           </div>
         )}
         
         {displaySrc && (
            <img 
              src={displaySrc} 
              alt="Microscope Slide" 
              className="max-h-full max-w-full object-contain shadow-2xl border border-slate-800/50"
            />
         )}
      </div>
    </div>
  );
};