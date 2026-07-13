import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, Loader } from 'lucide-react';

interface SlideViewerProps {
  slidePath: string;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ slidePath }) => {
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    setIsLoading(true);
  }, [slidePath]);

  return (
    <div className="w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-slate-900 rounded-xl overflow-hidden flex flex-col relative shadow-inner border border-slate-700">
      <div className="bg-slate-800 text-slate-300 px-2 sm:px-4 py-1 sm:py-2 text-xs font-mono flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 z-10 border-b border-slate-700 text-center sm:text-left">
        <span className="text-xs">MicroSmart Optics Viewer • Base Res: 416x416</span>
        <span className="text-xs hidden sm:inline">Scroll to Zoom • Drag to Pan</span>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-500 z-10 bg-slate-900">
            <Loader className="animate-spin" size={32} />
          </div>
        )}
        
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={8}
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <React.Fragment>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-col gap-1 sm:gap-2 bg-slate-800/80 p-1 sm:p-2 rounded-lg backdrop-blur-sm border border-slate-600">
                <button onClick={() => zoomIn()} className="p-1.5 sm:p-2 text-white hover:text-blue-400 transition-colors" title="Zoom In">
                  <ZoomIn size={18} />
                </button>
                <button onClick={() => zoomOut()} className="p-1.5 sm:p-2 text-white hover:text-blue-400 transition-colors" title="Zoom Out">
                  <ZoomOut size={18} />
                </button>
                <button onClick={() => resetTransform()} className="p-1.5 sm:p-2 text-white hover:text-blue-400 transition-colors border-t border-slate-600 pt-1.5 sm:pt-2 mt-1" title="Reset View">
                  <Maximize size={18} />
                </button>
              </div>

              <TransformComponent wrapperClass="w-full h-full flex items-center justify-center" contentClass="flex items-center justify-center">
                <div className="w-full max-w-[416px] h-auto aspect-square relative flex items-center justify-center shadow-2xl bg-black">
                  <img 
                    src={slidePath} 
                    alt="Microscopy slide" 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
};
