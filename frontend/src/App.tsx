import { useState, useRef, useEffect } from 'react';
import './App.css';
import { useAnalysis } from './hooks/useAnalysis';

// Components
import { Filmstrip } from './components/Filmstrip';
import { SmartViewer } from './components/SmartViewer';
import { BrainConsole } from './components/BrainConsole';

function App() {
  const { session, analyzeBatch, isProcessing, progressMsg, globalReport } = useAnalysis();
  
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW: UI State for sidebars to satisfy TypeScript
  const [isFilmstripCollapsed, setIsFilmstripCollapsed] = useState(false);
  const [isBrainCollapsed, setIsBrainCollapsed] = useState(false);

  // Check Backend Status on Load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const API_URL = rawApiUrl.replace(/\/$/, ""); 
        
        const res = await fetch(`${API_URL}/`); 
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (e) {
        setBackendStatus('offline');
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      analyzeBatch(Array.from(e.target.files));
      setSelectedSlideIndex(0);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-inter">
      
      {/* 1. Global Navigation */}
      <header className="h-14 bg-slate-900 border-b border-cyan-900/30 flex items-center px-6 justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center font-bold text-black">MS</div>
           <h1 className="text-lg font-bold tracking-wider text-slate-200">
             MICROSMART <span className="text-cyan-400 font-light">PF</span>
           </h1>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono border border-slate-700 px-2 py-1 rounded bg-slate-950">
                <span className={`w-2 h-2 rounded-full ${
                    backendStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                    backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                }`} />
                <span className={
                    backendStatus === 'online' ? 'text-green-400' : 
                    backendStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
                }>
                    {backendStatus === 'online' ? 'SYSTEM ONLINE' : 
                     backendStatus === 'offline' ? 'BRAIN DISCONNECTED' : 'CONNECTING...'}
                </span>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm font-medium transition-colors border border-slate-700"
            >
               New Session
            </button>
        </div>
      </header>

      {/* 2. Main Workstation Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {session.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-slate-950 to-slate-950" />
            
            <div 
              className="z-10 border-2 border-dashed border-slate-700 rounded-3xl p-16 text-center hover:border-cyan-500 hover:bg-slate-900/50 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
               <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300">🔬</div>
               <h2 className="text-3xl font-bold text-white mb-2">Initialize Session</h2>
               <p className="text-slate-400">Drop 1-10 slide images here to begin analysis</p>
               <input 
                 type="file" 
                 multiple 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFiles} 
                 accept="image/*"
               />
            </div>
          </div>
        ) : (
          <>
            <Filmstrip 
              session={session} 
              selectedIndex={selectedSlideIndex} 
              onSelect={setSelectedSlideIndex} 
              // Added Missing Props:
              isCollapsed={isFilmstripCollapsed}
              onToggle={() => setIsFilmstripCollapsed(!isFilmstripCollapsed)}
              onAddFiles={() => fileInputRef.current?.click()}
              onDeleteSlide={(id) => console.log("Deletion temporarily disabled", id)}
            />
            
            <SmartViewer 
              activeSlide={session[selectedSlideIndex]} 
            />
            
            <BrainConsole 
              report={globalReport} 
              isProcessing={isProcessing} 
              progressMsg={progressMsg}
              // Added Missing Props:
              isCollapsed={isBrainCollapsed}
              onToggle={() => setIsBrainCollapsed(!isBrainCollapsed)}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;