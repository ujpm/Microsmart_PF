import { useState } from 'react';
import './App.css';
import { useAnalysis } from './hooks/useAnalysis';

// Architecture Components
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { UploadZone } from './components/UploadZone';
import { WorkbenchLayout } from './components/WorkbenchLayout';

type ViewState = 'LANDING' | 'ANALYSIS';

function App() {
  // Core Logic Hook
  const { session, analyzeBatch, isProcessing, progressMsg, globalReport } = useAnalysis();
  
  // UI State
  const [view, setView] = useState<ViewState>('LANDING');
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);

  // Navigation Handlers
  const handleStart = () => setView('ANALYSIS');
  const handleHome = () => setView('LANDING'); 
  
  // File Handler
  const handleUpload = (files: File[]) => {
    analyzeBatch(files);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-inter bg-slate-950">
      
      {/* 1. ADAPTIVE NAVIGATION */}
      <Navbar 
        onHomeClick={handleHome} 
        onAnalysisClick={handleStart}
        variant={view === 'LANDING' ? 'landing' : 'workbench'}
      />

      {/* 2. VIEW CONTROLLER */}
      {view === 'LANDING' ? (
        // SCENE A: Landing Page (Scrollable, White)
        <div className="flex-1 overflow-y-auto bg-white">
           <LandingPage onStart={handleStart} />
        </div>
      ) : (
        // SCENE B: Workstation (Fixed, Dark)
        <div className="flex-1 flex flex-col overflow-hidden">
          {session.length === 0 ? (
            // State B1: Empty Workbench -> Upload
            <div className="flex-1 flex flex-col items-center justify-center relative">
               <UploadZone 
                 onFilesSelected={handleUpload} 
                 isProcessing={isProcessing}
               />
            </div>
          ) : (
            // State B2: Active Workbench -> Analysis
            <WorkbenchLayout 
              session={session}
              selectedIndex={selectedSlideIndex}
              onSelect={setSelectedSlideIndex}
              globalReport={globalReport}
              isProcessing={isProcessing}
              progressMsg={progressMsg}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;