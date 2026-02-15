import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';
import { useAnalysis } from './hooks/useAnalysis';

// Restore ALL your custom components
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { StatGrid } from './components/StatGrid';

function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'analysis'>('home');
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Our robust, working API hook
  const { session, analyzeBatch, isProcessing, progressMsg, globalReport } = useAnalysis();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      analyzeBatch([selectedFile]);
    }
  };

  // Map the new API data structure safely back to your StatGrid component
  const activeResult = session[0]?.result;
  const statData = activeResult ? {
    Red_Blood_Cell: activeResult.detailed_counts?.Red_Blood_Cell || 0,
    Leukocyte: activeResult.detailed_counts?.Leukocyte || 0,
    Ring: activeResult.detailed_counts?.Ring || 0,
    Trophozoite: activeResult.detailed_counts?.Trophozoite || 0,
    Gametocyte: activeResult.detailed_counts?.Gametocyte || 0,
    Schizont: activeResult.detailed_counts?.Schizont || 0,
    // StatGrid expects a number, so we parse "1.50%" into 1.50
    parasitemia_pct: parseFloat(activeResult.parasitemia_calculation?.value) || 0 
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      {/* 1. Navbar */}
      <Navbar 
        onHomeClick={() => setCurrentView('home')} 
        onAnalysisClick={() => setCurrentView('analysis')} 
      />

      {/* 2. Main Content Routing */}
      {currentView === 'home' ? (
        <LandingPage onStart={() => setCurrentView('analysis')} />
      ) : (
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          
          {/* Your HUD Banner */}
          <Header />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            
            {/* Left Column: Upload & Vision Result */}
            <div className="lg:col-span-1 space-y-6">
              <UploadZone
                onFileSelect={handleFileSelect} // FIX: Matches your UploadZone component
                onAnalyze={handleAnalyze}
                file={selectedFile}
                previewUrl={activeResult ? activeResult.annotated_image : previewUrl}
                loading={isProcessing}
              />
            </div>

            {/* Right Column: Stats & Brain Agent */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Your Parameter Table */}
              {statData ? (
                 <StatGrid data={statData} />
              ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center h-32 text-slate-400 italic">
                   Awaiting vision metrics...
                </div>
              )}

              {/* Brain Agent Clinical Report Area */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                  <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-purple-500'}`} />
                  <h2 className="text-lg font-bold text-slate-800">Cerebras Clinical Assessment</h2>
                </div>
                
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-blue-600 font-medium animate-pulse">
                      {progressMsg || "Waiting for assessment..."}
                    </p>
                  </div>
                ) : globalReport ? (
                  <article className="prose prose-slate prose-sm max-w-none prose-headings:text-blue-700 prose-a:text-blue-600">
                    <ReactMarkdown>{globalReport}</ReactMarkdown>
                  </article>
                ) : (
                  <div className="text-slate-400 italic text-center py-16">
                    Upload a sample to generate clinical insights.
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 3. Your Custom Footer */}
      <Footer />
    </div>
  );
}

export default App;