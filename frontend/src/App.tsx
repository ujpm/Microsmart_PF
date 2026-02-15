import { useState, useRef } from 'react';
import './App.css';
import { useAnalysis } from './hooks/useAnalysis';
import { Filmstrip } from './components/Filmstrip';
import { SmartViewer } from './components/SmartViewer';
import { BrainConsole } from './components/BrainConsole';

function App() {
  const { session, analyzeBatch, isProcessing, progressMsg, globalReport } = useAnalysis();
  
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NEW STATE: Sidebar Collapsibility ---
  const [isFilmstripCollapsed, setIsFilmstripCollapsed] = useState(false);
  const [isBrainConsoleCollapsed, setIsBrainConsoleCollapsed] = useState(false);

  // --- Handlers ---
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      analyzeBatch(Array.from(e.target.files));
      setSelectedSlideIndex(0); // Reset to first slide
    }
  };

  const handleAddFiles = (newFiles: File[]) => {
    // Combine existing files with the new ones and re-run batch
    const currentFiles = session.map(s => s.originalFile);
    analyzeBatch([...currentFiles, ...newFiles]);
  };

  const handleDeleteSlide = (id: string) => {
    // Filter out the deleted slide and re-run batch
    const currentFiles = session.filter(s => s.id !== id).map(s => s.originalFile);
    if (currentFiles.length === 0) {
       // If they deleted the last slide, passing an empty array will trigger the empty state UI
       analyzeBatch([]);
    } else {
       analyzeBatch(currentFiles);
       setSelectedSlideIndex(0); // Safely reset index so it doesn't break
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      <header className="h-14 bg-slate-900 border-b border-cyan-900/30 flex items-center px-6 justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center font-bold text-black">MS</div>
           <h1 className="text-lg font-bold tracking-wider text-slate-200">
             MICROSMART <span className="text-cyan-400 font-light">PF</span>
           </h1>
        </div>
        <button onClick={() => window.location.reload()} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm border border-slate-700">
           New Session
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {session.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
            <div className="z-10 border-2 border-dashed border-slate-700 rounded-3xl p-16 text-center hover:border-cyan-500 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <div className="text-7xl mb-6">🔬</div>
               <h2 className="text-3xl font-bold text-white mb-2">Initialize Session</h2>
               <p className="text-slate-400">Drop 1-10 slide images here to begin analysis</p>
               <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFiles} accept="image/*" />
            </div>
          </div>
        ) : (
          <>
            <Filmstrip 
              session={session} 
              selectedIndex={selectedSlideIndex} 
              onSelect={setSelectedSlideIndex} 
              
              // --- FIX: Missing Props Added Here ---
              isCollapsed={isFilmstripCollapsed}
              onToggle={() => setIsFilmstripCollapsed(!isFilmstripCollapsed)}
              onAddFiles={handleAddFiles}
              onDeleteSlide={handleDeleteSlide}
            />
            
            <SmartViewer activeSlide={session[selectedSlideIndex]} />
            
            <BrainConsole 
              report={globalReport} 
              isProcessing={isProcessing} 
              progressMsg={progressMsg} 
              
              // --- FIX: Missing Props Added Here ---
              activeSlideData={session[selectedSlideIndex]?.result}
              isCollapsed={isBrainConsoleCollapsed}
              onToggle={() => setIsBrainConsoleCollapsed(!isBrainConsoleCollapsed)}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;