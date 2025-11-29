import React, { useState } from 'react';
import { UploadCloud, Activity, FileText, Microscope } from 'lucide-react';

// Interfaces for our data
interface VisionData {
  counts: Record<string, number>;
  parasitemia_pct: number;
}

interface DiagnosisResult {
  analysis: VisionData;
  report: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null); // Reset previous results
    }
  };

  // Handle Analysis Request
  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Connect to our FastAPI Backend
      // Note: We use the VITE_API_URL from .env
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis Failed");
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Error processing sample. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-medical-50 flex flex-col">
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-medical-100 px-6 py-4 flex items-center shadow-sm">
        <div className="bg-medical-500 p-2 rounded-lg text-white mr-3">
          <Microscope size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-medical-900">MicroSmart PF</h1>
          <p className="text-xs text-slate-500 font-medium tracking-wider">AUTONOMOUS MALARIA AGENT</p>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Vision / Upload */}
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h2 className="text-lg font-semibold text-medical-900 mb-4 flex items-center">
              <UploadCloud className="mr-2" size={20} />
              Sample Acquisition
            </h2>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-medical-200 rounded-xl p-8 text-center hover:bg-medical-50 transition-colors relative">
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
              {preview ? (
                <img 
                  src={preview} 
                  alt="Blood Smear" 
                  className="max-h-64 mx-auto rounded-md shadow-md object-contain" 
                />
              ) : (
                <div className="text-slate-400">
                  <p>Drag & drop blood smear image here</p>
                  <p className="text-xs mt-2">Supports JPG, PNG (Giemsa Stain)</p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`w-full mt-6 py-3 rounded-lg font-semibold text-white transition-all flex justify-center items-center ${
                !file || loading 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-medical-600 hover:bg-medical-700 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Swarm...
                </>
              ) : "Run Diagnostics"}
            </button>

            {/* Quantitative Results (The Vision Agent) */}
            {result && (
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-medical-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500 uppercase">Parasitemia</p>
                  <p className="text-xl font-bold text-danger-600">{result.analysis.parasitemia_pct}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500 uppercase">RBC Count</p>
                  <p className="text-xl font-bold text-slate-700">{result.analysis.counts.Red_Blood_Cell || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500 uppercase">WBC Count</p>
                  <p className="text-xl font-bold text-slate-700">{result.analysis.counts.Leukocyte || 0}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Brain / Report */}
        <section className="h-full">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-medical-900 mb-4 flex items-center">
              <FileText className="mr-2" size={20} />
              Clinical Assessment
            </h2>
            
            <div className="flex-1 bg-slate-50 rounded-lg p-6 border border-slate-100 overflow-auto">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <Activity size={48} className="mb-4" />
                  <p>Awaiting scan data...</p>
                </div>
              ) : (
                <article className="prose prose-slate prose-sm max-w-none">
                  {/* We render the markdown report from Llama 3.3 here */}
                  <div className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
                    {result.report}
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;