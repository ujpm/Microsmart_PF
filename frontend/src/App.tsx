import { useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';

// Components
import { UploadZone } from './components/UploadZone';
import { LandingPage } from './components/LandingPage';
import { Filmstrip } from './components/Filmstrip';
import { SmartViewer } from './components/SmartViewer';
import { BrainConsole } from './components/BrainConsole';
import { SessionHUD } from './components/SessionHUD';
import { Footer } from './components/Footer'; // IMPORTED

// Icons
import { 
  PanelLeftClose, PanelLeftOpen, 
  PanelRightClose, PanelRightOpen, 
  Microscope,
  Home
} from 'lucide-react';

function App() {
  const { session, analyzeBatch, isProcessing, progressMsg, globalReport } = useAnalysis();
  
  // Layout State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);

  const activeSlide = session[selectedSlideIndex];

  // --- HANDLERS ---
  const handleStartSession = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('upload-trigger')?.click();
    }
  };

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      analyzeBatch(files);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-inter selection:bg-cyan-500/30">
      
      {/* 1. TOP BAR */}
      <header className="h-10 bg-slate-950 border-b border-slate-800 flex items-center px-4 justify-between shrink-0 z-50">
         <div className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-400">
            <Microscope size={16} className="text-cyan-500"/>
            <span>MICROSMART <span className="text-cyan-600">PF</span></span>
         </div>
         
         {session.length > 0 && (
           <button 
             onClick={() => window.location.reload()}
             className="text-xs flex items-center gap-1 text-slate-500 hover:text-cyan-400 transition-colors"
           >
             <Home size={12} /> END SESSION
           </button>
         )}
      </header>

      {/* 2. MAIN CONTENT */}
      {session.length === 0 ? (
        // STATE A: ENTRY (Landing + Upload)
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
           
           <LandingPage onStart={handleStartSession}>
             <div id="upload-section" className="max-w-4xl mx-auto px-4 pb-20 pt-10 border-t border-slate-800/50">
               <div className="flex items-center gap-4 mb-8 justify-center">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Initialization Protocol</span>
               </div>
               <UploadZone onFilesSelected={handleFiles} />
             </div>
           </LandingPage>
           
           <input 
             id="upload-trigger" 
             type="file" 
             multiple 
             className="hidden" 
             onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
             accept="image/*"
           />
        </div>
      ) : (
        // STATE B: ACTIVE WORKBENCH
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* HUD Banner */}
          <SessionHUD activeSlide={activeSlide} />

          {/* 3-Column Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* COL 1: FILMSTRIP */}
            <div className={`
                ${leftOpen ? 'w-64' : 'w-0'} 
                bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out relative flex flex-col shrink-0
            `}>
               <div className="overflow-hidden h-full w-64">
                  <Filmstrip session={session} selectedIndex={selectedSlideIndex} onSelect={setSelectedSlideIndex} />
               </div>
            </div>

            {/* COL 2: MAIN STAGE */}
            <div className="flex-1 flex flex-col relative bg-black min-w-0 z-0">
               
               {/* Layout Toggles */}
               <div className="absolute top-4 left-4 z-30 flex gap-2 group">
                  <button 
                    onClick={() => setLeftOpen(!leftOpen)} 
                    className="p-2 bg-slate-900/50 hover:bg-cyan-900/80 rounded-lg text-slate-300 hover:text-cyan-400 backdrop-blur border border-slate-700 transition-all shadow-lg"
                    title="Toggle Sidebar"
                  >
                     {leftOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}
                  </button>
               </div>
               
               <div className="absolute top-4 right-4 z-30 flex gap-2 group">
                  <button 
                    onClick={() => setRightOpen(!rightOpen)} 
                    className="p-2 bg-slate-900/50 hover:bg-cyan-900/80 rounded-lg text-slate-300 hover:text-cyan-400 backdrop-blur border border-slate-700 transition-all shadow-lg"
                    title="Toggle Agent Console"
                  >
                     {rightOpen ? <PanelRightClose size={18}/> : <PanelRightOpen size={18}/>}
                  </button>
               </div>

               <SmartViewer activeSlide={activeSlide} />
            </div>

            {/* COL 3: BRAIN CONSOLE */}
            <div className={`
                ${rightOpen ? 'w-[400px]' : 'w-0'} 
                bg-slate-900 border-l border-slate-800 transition-all duration-300 ease-in-out relative flex flex-col shrink-0
            `}>
               <div className="overflow-hidden h-full w-[400px]"> 
                  <BrainConsole 
                    report={globalReport} 
                    isProcessing={isProcessing} 
                    progressMsg={progressMsg}
                    activeSlideData={activeSlide?.result} 
                  />
               </div>
            </div>

          </div>

          {/* ADDED: Compact Footer for Workbench */}
          <Footer compact />
        </div>
      )}
    </div>
  );
}

export default App;