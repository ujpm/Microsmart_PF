import React from 'react';
import { Header } from './Header';
import { Filmstrip } from './Filmstrip';
import { SmartViewer } from './SmartViewer';
import { BrainConsole } from './BrainConsole';
import type { SessionItem } from '../hooks/useAnalysis'; 

interface WorkbenchLayoutProps {
  session: SessionItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  globalReport: string | null;
  isProcessing: boolean;
  progressMsg: string;
}

export const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({
  session,
  selectedIndex,
  onSelect,
  globalReport,
  isProcessing,
  progressMsg
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <Header /> {/* Logo 3 Header */}
      
      <div className="flex-1 flex overflow-hidden">
        <Filmstrip 
          session={session} 
          selectedIndex={selectedIndex} 
          onSelect={onSelect} 
        />
        
        <SmartViewer 
          activeSlide={session[selectedIndex]} 
        />
        
        <BrainConsole 
          report={globalReport} 
          isProcessing={isProcessing} 
          progressMsg={progressMsg}
        />
      </div>
    </div>
  );
};