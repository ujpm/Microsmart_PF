import { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { StatGrid } from './components/StatGrid';
import { ClinicalReport } from './components/ClinicalReport';
import { useAnalysis } from './hooks/useAnalysis';

function App() {
  // UI State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Logic State
  const { analyze, result, loading, reset } = useAnalysis();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    reset(); // Clear old results when new file is picked
  };

  const handleAnalyzeClick = async () => {
    if (!file) return;
    const data = await analyze(file);
    
    // If we got a new annotated image from AI, update the preview!
    if (data?.analysis?.annotated_image) {
      setPreview(`data:image/jpeg;base64,${data.analysis.annotated_image}`);
    }
  };

  return (
    <div className="min-h-screen bg-medical-50 flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <section className="flex flex-col gap-6">
          <UploadZone 
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyzeClick}
            file={file}
            previewUrl={preview}
            loading={loading}
          />
          
          {/* Only show stats if we have results */}
          {result && (
            <div className="animate-fade-in-up">
              <StatGrid data={result.analysis} />
            </div>
          )}
        </section>

        {/* Right Column */}
        <section className="h-full">
          <ClinicalReport report={result?.report || null} />
        </section>

      </main>
    </div>
  );
}

export default App;