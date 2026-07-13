import React, { useRef, useEffect } from 'react';

interface HistoryFilmstripProps {
  totalSlides: number;
  currentIndex: number;
  history: Record<number, any>;
  onNavigate: (index: number) => void;
}

export const HistoryFilmstrip: React.FC<HistoryFilmstripProps> = ({ totalSlides, currentIndex, history, onNavigate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep the current slide visible
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[currentIndex - 1] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const boxes = [];
  for (let i = 1; i <= totalSlides; i++) {
    const isCurrent = i === currentIndex;
    const record = history[i];
    const isCompleted = !!record;
    const isFlagged = record?.is_flagged;

    let baseClass = "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center rounded-md text-xs font-bold cursor-pointer transition-all border-2 ";
    
    if (isCurrent) {
      baseClass += "border-slate-900 bg-white scale-110 shadow-md text-slate-900 z-10";
    } else if (isFlagged) {
      baseClass += "border-red-400 bg-red-100 text-red-700 hover:bg-red-200";
    } else if (isCompleted) {
      baseClass += "border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100";
    } else {
      baseClass += "border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200";
    }

    boxes.push(
      <div key={i} onClick={() => onNavigate(i)} className={baseClass}>
        {i}
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-slate-200 p-2 sm:p-4">
      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide hidden sm:block">Session History & Navigation</p>
      <div 
        ref={scrollRef}
        className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
      >
        {boxes}
      </div>
    </div>
  );
};
