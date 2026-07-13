import React, { useState, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, Bug, Activity, Circle, Shield } from 'lucide-react';
import { type SessionItem } from '../hooks/useAnalysis';

interface SmartViewerProps {
  activeSlide?: SessionItem;
}

const CLASS_GUIDE: Record<string, { color: string; icon: React.ElementType }> = {
  'P. falciparum': { color: '#ef4444', icon: Bug },      
  'P. vivax': { color: '#f97316', icon: Activity },      
  'WBC': { color: '#3b82f6', icon: Shield },             
  'RBC': { color: '#64748b', icon: Circle },             
  'default': { color: '#eab308', icon: Circle }          
};

export const SmartViewer = ({ activeSlide }: SmartViewerProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [imgDim, setImgDim] = useState({ width: 0, height: 0 });

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

  const rawImageSrc = activeSlide.originalFile ? URL.createObjectURL(activeSlide.originalFile) : null;
  const predictions = activeSlide.result?.predictions || [];
  const isAiReady = !!activeSlide.result;

  const detectedClasses = useMemo(() => {
    const classes = new Set<string>();
    predictions.forEach((p: any) => classes.add(p.class_name));
    return Array.from(classes);
  }, [predictions]);

  return (
    <div className="flex-1 bg-black flex flex-col relative overflow-hidden h-full">
      <div className="h-14 bg-slate-900 border-b border-slate-700 flex justify-between items-center px-6 shrink-0 z-10">
        <div className="flex flex-col">
           <span className="font-mono text-sm text-slate-400">FILENAME</span>
           <span className="text-slate-200 font-medium truncate max-w-md">{activeSlide.originalFile?.name || 'Unknown'}</span>
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
                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${showOriginal ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            
            <span className={`text-xs font-bold ${showOriginal ? 'text-white' : 'text-slate-600'}`}>RAW</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative bg-dots-pattern overflow-hidden">
         {activeSlide.status === 'processing' && (
           <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
             <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
             <div className="text-cyan-400 font-mono tracking-widest animate-pulse">SCANNING CELLULAR STRUCTURE...</div>
           </div>
         )}
         
         {isAiReady && !showOriginal && detectedClasses.length > 0 && (
           <div className="absolute top-4 left-4 z-30 bg-slate-900/90 border border-slate-700 backdrop-blur-md rounded-lg p-3 shadow-xl">
             <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider border-b border-slate-700 pb-1">Detected Objects</div>
             <div className="flex flex-col gap-2">
               {detectedClasses.map(className => {
                 const config = CLASS_GUIDE[className] || CLASS_GUIDE.default;
                 const Icon = config.icon;
                 return (
                   <div key={className} className="flex items-center gap-2">
                     <div className="p-1 rounded bg-slate-800" style={{ color: config.color }}><Icon size={14} strokeWidth={3} /></div>
                     <span className="text-xs font-medium text-slate-300">{className}</span>
                   </div>
                 );
               })}
             </div>
           </div>
         )}

         <TransformWrapper initialScale={1} minScale={0.5} maxScale={8}>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-700 backdrop-blur-md">
                <button onClick={() => zoomIn()} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"><ZoomIn size={20}/></button>
                <button onClick={() => zoomOut()} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"><ZoomOut size={20}/></button>
                <button onClick={() => resetTransform()} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"><Maximize size={20}/></button>
              </div>

              <TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
                <div className="relative inline-block leading-none">
                  <img 
                    src={rawImageSrc || undefined} 
                    alt="Microscope Slide" 
                    className="max-h-full max-w-full block shadow-2xl"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      setImgDim({ width: target.naturalWidth, height: target.naturalHeight });
                    }}
                  />

                  {isAiReady && !showOriginal && imgDim.width > 0 && predictions.map((pred: any, idx: number) => {
                    const left = ((pred.box.x_center - pred.box.width / 2) / imgDim.width) * 100;
                    const top = ((pred.box.y_center - pred.box.height / 2) / imgDim.height) * 100;
                    const width = (pred.box.width / imgDim.width) * 100;
                    const height = (pred.box.height / imgDim.height) * 100;
                    const config = CLASS_GUIDE[pred.class_name] || CLASS_GUIDE.default;

                    return (
                      <div
                        key={idx}
                        className="absolute border-2 pointer-events-none rounded-sm transition-opacity duration-300"
                        style={{
                          left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                          borderColor: config.color, boxShadow: `0 0 10px ${config.color}30 inset`,
                        }}
                      />
                    );
                  })}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
};
