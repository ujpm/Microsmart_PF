import { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { StatGrid } from './components/StatGrid';
import { ClinicalReport } from './components/ClinicalReport';
import { useAnalysis } from './hooks/useAnalysis';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // FIXED: Destructure "results" (plural) to match the hook
  const { analyze, results, loading, reset, error } = useAnalysis();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    reset(); 
  };

  const handleAnalyzeClick = async () => {
    if (!file) return;
    const data = await analyze(file);
    
    // Now that analyze() returns data, this will work!
    if (data?.analysis?.annotated_image) {
      setPreview(`data:image/jpeg;base64,${data.analysis.annotated_image}`);
    }
  };

  return (
    <div className="min-h-screen bg-medical-50 flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Error message display */}
        {error && (
           <div className="col-span-full p-4 bg-red-100 text-red-700 rounded-lg mb-4">
             {error}
           </div>
        )}

        {/* Left Column */}
        <section className="flex flex-col gap-6">
          <UploadZone 
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyzeClick}
            file={file}
            previewUrl={preview}
            loading={loading}
          />
          
          {/* FIXED: Check for "results" (plural) */}
          {results && (
            <div className="animate-fade-in-up">
              <StatGrid data={results.analysis} />
            </div>
          )}
        </section>

        {/* Right Column */}
        <section className="h-full">
          {/* FIXED: Pass "results.report" */}
          <ClinicalReport report={results?.report || null} />
        </section>
      </main>
    </div>
  );
}

export default App;