import { useState } from 'react';
import './App.css';
import { useAnalysis } from './hooks/useAnalysis';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { WorkbenchLayout } from './components/WorkbenchLayout';
import { About } from './pages/About'; // Import the new page

type ViewState = 'LANDING' | 'ANALYSIS' | 'ABOUT';

function App() {
  const { session, addFiles, removeSlide, isProcessing, progressMsg, globalReport, resetSession } = useAnalysis();
  
  const [view, setView] = useState<ViewState>('LANDING');
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);

  // Navigation Handlers
  const handleStart = () => setView('ANALYSIS');
  const handleHome = () => setView('LANDING');
  const handleAbout = () => setView('ABOUT');
  
  const handleExitSession = () => {
    resetSession(); 
    setView('LANDING'); 
  };
  
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-inter bg-slate-950">
      
      {view === 'LANDING' ? (
        <>
           <Navbar 
             onHomeClick={handleHome} 
             onAnalysisClick={handleStart} 
             onAboutClick={handleAbout}
             variant="landing" 
           />
           <div className="flex-1 overflow-y-auto bg-slate-950">
               <LandingPage onStart={handleStart} />
           </div>
        </>
      ) : view === 'ABOUT' ? (
        <>
           {/* Reuse Navbar for consistency */}
           <Navbar 
             onHomeClick={handleHome} 
             onAnalysisClick={handleStart} 
             onAboutClick={handleAbout}
             variant="landing" 
           />
           <About onStart={handleStart} />
        </>
      ) : (
        /* WORKBENCH MODE */
        <WorkbenchLayout 
          session={session}
          selectedIndex={selectedSlideIndex}
          onSelect={setSelectedSlideIndex}
          globalReport={globalReport}
          isProcessing={isProcessing}
          progressMsg={progressMsg}
          onExit={handleExitSession}
          onAddFiles={addFiles}
          onDeleteSlide={removeSlide}
        />
      )}
    </div>
  );
}

export default App;