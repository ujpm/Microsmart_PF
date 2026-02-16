import React, { useState, useEffect } from 'react';
import { WorkbenchHeader } from './WorkbenchHeader';
import { Filmstrip } from './Filmstrip';
import { SmartViewer } from './SmartViewer';
import { BrainConsole } from './BrainConsole';
import { SessionHUD } from './SessionHUD';
import { UploadZone } from './UploadZone'; // Import UploadZone
import type { SessionItem } from '../hooks/useAnalysis'; 

interface WorkbenchLayoutProps {
  session: SessionItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  globalReport: string | null;
  isProcessing: boolean;
  progressMsg: string;
  onExit: () => void;
  onAddFiles: (files: File[]) => void;   // New Prop
  onDeleteSlide: (id: string) => void;   // New Prop
}

export const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({
  session,
  selectedIndex,
  onSelect,
  globalReport,
  isProcessing,
  progressMsg,
  onExit,
  onAddFiles,
  onDeleteSlide
}) => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Derive the active slide safely
  const activeSlide = session[selectedIndex];
  
  // LOGIC: If session is empty, we must show the Upload State
  const isEmptySession = session.length === 0;

  // KEYBOARD NAVIGATION
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEmptySession) return;
      
      if (e.key === 'ArrowRight') {
         onSelect(Math.min(selectedIndex + 1, session.length - 1));
      } else if (e.key === 'ArrowLeft') {
         onSelect(Math.max(selectedIndex - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.length, selectedIndex, onSelect, isEmptySession]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden text-slate-200 font-inter">
      {/* 1. TOP DECK */}
      <WorkbenchHeader onEndSession={onExit} />
      
      {/* HUD Banner (Only if we have data) */}
      {!isProcessing && activeSlide?.result && !isEmptySession && (
         <div className="shrink-0 relative z-40">
            <SessionHUD activeSlide={activeSlide} />
         </div>
      )}

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative z-0">
        
        {/* LEFT PANE */}
        <Filmstrip 
          session={session} 
          selectedIndex={selectedIndex} 
          onSelect={onSelect} 
          isCollapsed={!leftOpen}
          onToggle={() => setLeftOpen(!leftOpen)}
          onAddFiles={onAddFiles}
          onDeleteSlide={onDeleteSlide}
        />
        
{/* CENTER STAGE */}
        {isEmptySession ? (
           <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 relative">
              <UploadZone 
               onFileSelect={(files) => onAddFiles(files)} 
               loading={isProcessing} 
              />
           </div>
        ) : (
           <SmartViewer activeSlide={activeSlide} />
        )}
        
        {/* RIGHT PANE */}
        <BrainConsole 
          report={globalReport} 
          isProcessing={isProcessing} 
          progressMsg={progressMsg}
          activeSlideData={activeSlide?.result}
          isCollapsed={!rightOpen}
          onToggle={() => setRightOpen(!rightOpen)}
        />
      </div>

      {/* 3. FIXED FOOTER */}
      <div className="h-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-600 shrink-0 select-none">
         <div className="flex gap-4">
           <span>MicroSmart PF v1.2</span>
           <span>LATENCY: 12ms</span>
         </div>
         <div className="flex gap-4">
           <span>© 2026 MicroSmart Inc.</span>
           <span className="text-cyan-900">Research Use Only</span>
         </div>
      </div>
    </div>
  );
};