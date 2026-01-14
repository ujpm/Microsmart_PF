import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { UploadZone } from './components/UploadZone';
import { StatGrid } from './components/StatGrid';
import { ResearchInterpretation } from './components/ResearchInterpretation';
import { useAnalysis } from './hooks/useAnalysis';

function App() {
  // Navigation State
  const [view, setView] = useState<'home' | 'analysis'>('home');
  
  // UI State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Logic State
  const { analyze, results, loading, reset, error } = useAnalysis();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    reset(); 
  };

  const handleStartAnalysis = async () => {
    if (!file) return;
    const data = await analyze(file);
    
    // Update preview with YOLOv8 agent's visual output
    if (data?.analysis?.annotated_image) {
      setPreview(`data:image/jpeg;base64,${data.analysis.annotated_image}`);
    }
  };

  return (
    <div className="min-h-screen bg-medical-50 flex flex-col font-sans">
      <Navbar 
        onHomeClick={() => setView('home')} 
        onAnalysisClick={() => setView('analysis')} 
      />
      
      <main className="flex-1">
        {view === 'home' ? (
          <LandingPage onStart={() => setView('analysis')} />
        ) : (
          <div className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {error && (
              <div className="col-span-full p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-4 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Left Column: The Eye (Input/Vision) */}
            <section className="flex flex-col gap-6">
              <UploadZone 
                onFileSelect={handleFileSelect}
                onAnalyze={handleStartAnalysis}
                file={file}
                previewUrl={preview}
                loading={loading}
              />
              
              {results && (
                <div className="animate-in zoom-in-95 duration-500">
                  <StatGrid data={results.analysis} />
                </div>
              )}
            </section>

            {/* Right Column: The Brain (Reasoning) */}
            <section className="h-full">
              <ResearchInterpretation report={results?.report || null} />
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;