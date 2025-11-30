import React, { useState } from 'react';
import { UploadCloud, Activity, FileText, Microscope, Search, Database } from 'lucide-react';

// --- Types ---
interface VisionData {
  counts: Record<string, number>;
  parasitemia_pct: number;
}

interface DiagnosisResult {
  case_id: string;
  analysis: VisionData;
  report: string;
}

interface SearchMatch {
  score: number;
  text: string;
  metadata?: Record<string, any>;
}

function App() {
  // --- State: Diagnosis ---
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // --- State: Memory Search ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);

  // --- Handlers: File ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null); 
    }
  };

  // --- Handlers: API ---
  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
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
      alert("Error processing sample. Ensure Backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!response.ok) throw new Error("Search Failed");

      const data = await response.json();
      // Raindrop returns { matches: [...] }
      setSearchResults(data.matches || []);
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-medical-50 flex flex-col font-sans text-slate-800">
      
      {/* HEADER */}
      <header className="bg-white border-b border-medical-100 px-8 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <div className="bg-medical-500 p-2 rounded-lg text-white mr-4 shadow-sm">
          <Microscope size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-medical-900 tracking-tight">MicroSmart PF</h1>
          <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Autonomous Malaria Agent</p>
        </div>
        <div className="ml-auto flex items-center space-x-2 text-xs font-semibold text-medical-600 bg-medical-50 px-3 py-1 rounded-full border border-medical-100">
          <Database size={14} />
          <span>RAINDROP CONNECTED</span>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-12">
        
        {/* SECTION 1: ACTIVE DIAGNOSIS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* A. Upload & Vision */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px]">
            <h2 className="text-lg font-semibold text-medical-900 mb-6 flex items-center">
              <UploadCloud className="mr-2 text-medical-500" size={20} />
              Sample Acquisition
            </h2>

            <div className="flex-1 border-2 border-dashed border-medical-200 rounded-xl bg-slate-50 relative overflow-hidden group hover:bg-medical-50 transition-colors">
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept="image/*"
              />
              {preview ? (
                <img 
                  src={preview} 
                  alt="Blood Smear" 
                  className="w-full h-full object-contain p-4" 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <UploadCloud size={48} className="mb-4 text-medical-200" />
                  <p className="font-medium">Drop Blood Smear Image</p>
                  <p className="text-xs mt-2 text-slate-400">Giemsa Stain • 40x/100x</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-md transition-all flex justify-center items-center ${
                  !file || isAnalyzing 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-medical-600 hover:bg-medical-700 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {isAnalyzing ? "Processing Swarm..." : "Run Diagnostics"}
              </button>
            </div>

            {/* Vision Metrics */}
            {result && (
              <div className="mt-6 grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                  <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Parasitemia</p>
                  <p className="text-2xl font-black text-danger-600">{result.analysis.parasitemia_pct}%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">RBCs</p>
                  <p className="text-2xl font-bold text-slate-700">{result.analysis.counts.Red_Blood_Cell || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">WBCs</p>
                  <p className="text-2xl font-bold text-slate-700">{result.analysis.counts.Leukocyte || 0}</p>
                </div>
              </div>
            )}
          </section>

          {/* B. Clinical Reasoning (The Brain) */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-medical-900 flex items-center">
                <FileText className="mr-2 text-medical-500" size={20} />
                Clinical Assessment
              </h2>
              {result && (
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  CASE ID: {result.case_id}
                </span>
              )}
            </div>
            
            <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100 overflow-y-auto custom-scrollbar">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400/50">
                  <Activity size={64} className="mb-4" />
                  <p className="font-medium">Awaiting analysis data...</p>
                </div>
              ) : (
                <article className="prose prose-slate prose-sm max-w-none">
                  <div className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
                    {result.report}
                  </div>
                </article>
              )}
            </div>
          </section>
        </div>

        {/* SECTION 2: RAINDROP MEMORY SEARCH */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-medical-900 flex items-center">
                <Search className="mr-2 text-medical-500" size={20} />
                Patient Records Search
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Semantic search across {import.meta.env.VITE_BUCKET_NAME || 'Global'} SmartBucket
              </p>
            </div>
            
            <div className="flex w-full md:w-auto gap-2">
              <input 
                type="text" 
                placeholder='e.g., "Severe falciparum cases from last week"' 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 md:w-96 px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-medical-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-medical-700 transition-colors disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Search Results Area */}
          <div className="p-6 bg-slate-50 min-h-[200px]">
            {searchResults.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <Database size={48} className="mx-auto mb-3 opacity-20" />
                <p>No query results to display.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((match, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-medical-50 text-medical-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                        Match {(match.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-4 font-mono leading-relaxed">
                      {match.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;