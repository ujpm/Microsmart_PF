import { useState } from 'react';

export interface VisionResult {
  summary_headline: string;
  total_parasites: number;
  parasitemia_calculation: { status: string; value: string; rbc_count: number; };
  detailed_counts: Record<string, number>;
  annotated_image: string; 
}

export interface SessionItem {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  originalFile: File;
  result: VisionResult | null;
}

export const useAnalysis = () => {
  const [session, setSession] = useState<SessionItem[]>([]);
  const [globalReport, setGlobalReport] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const API_URL = RAW_API_URL.replace(/\/$/, ""); // strips trailing slash

  // Update 1: Dynamic Calculation (Safe for both models)
  const calculateAggregate = (items: SessionItem[]) => {
    let totalP = 0; let totalRBC = 0;
    const counts: Record<string, number> = {};

    items.forEach(item => {
      if (item.result) {
        totalP += item.result.total_parasites;
        totalRBC += item.result.parasitemia_calculation.rbc_count;
        
        Object.entries(item.result.detailed_counts).forEach(([key, val]) => {
          if (counts[key] === undefined) counts[key] = 0;
          counts[key] += val;
        });
      }
    });

    // Safeguard to prevent UI errors if it looks for MicroSmart's hardcoded classes
    if (!('Ring' in counts)) counts['Ring'] = 0;
    if (!('Trophozoite' in counts)) counts['Trophozoite'] = 0;
    if (!('Gametocyte' in counts)) counts['Gametocyte'] = 0;
    if (!('Schizont' in counts)) counts['Schizont'] = 0;

    let pct = "N/A";
    if (totalRBC > 0) pct = ((totalP / (totalRBC + totalP)) * 100).toFixed(2) + "%";
    return { totalP, pct, counts };
  };

  // Update 2: Pass engine into the runner
  const addFiles = (newFiles: File[], engineChoice: 'local' | 'cloud' = 'local') => {
    const newItems: SessionItem[] = newFiles.map((f, idx) => ({
      id: `slide-${Date.now()}-${idx}`,
      status: 'pending', 
      originalFile: f, 
      result: null
    }));
    
    const nextSession = [...session, ...newItems];
    setSession(nextSession);
    runBatchAnalysis(nextSession, engineChoice); 
  };

  // Update 3: Append engine to the API Fetch
  const runBatchAnalysis = async (currentSession: SessionItem[], engine: string) => {
    setIsProcessing(true);
    setGlobalReport(null);
    const updatedSession = [...currentSession];

    for (let i = 0; i < updatedSession.length; i++) {
      if (updatedSession[i].status !== 'pending') continue;

      setProgressMsg(`Scanning Slide ${i + 1} of ${updatedSession.length}...`);
      updatedSession[i].status = 'processing';
      setSession([...updatedSession]);

      try {
        const formData = new FormData();
        formData.append("file", updatedSession[i].originalFile);
        
        // Appends the engine exactly how main.py expects it
        const res = await fetch(`${API_URL}/analyze?mode=vision_only&engine=${engine}`, { 
            method: "POST", 
            body: formData 
        });
        
        if (!res.ok) throw new Error("API Error");
        
        const data = await res.json();
        updatedSession[i].status = 'done';
        updatedSession[i].result = data.analysis;
      } catch (err) {
        updatedSession[i].status = 'error';
      }
      setSession([...updatedSession]);
    }

    // 2. Generate Final Report (if there are processed slides)
    const validSlides = updatedSession.filter(s => s.status === 'done');
    if (validSlides.length > 0) {
        setProgressMsg("Generating Clinical Report...");
        const stats = calculateAggregate(validSlides);
        
        try {
          const brainRes = await fetch(`${API_URL}/diagnose`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                total_parasites: stats.totalP, 
                parasitemia_pct: stats.pct, 
                detailed_counts: stats.counts 
            })
          });
          const brainData = await brainRes.json();
          setGlobalReport(brainData.report);
        } catch (err) {
          setGlobalReport("Error generating report.");
        }
    } else {
        setGlobalReport(null);
    }
    
    setIsProcessing(false);
    setProgressMsg("");
  };


  const addFiles = (newFiles: File[]) => {
    const newItems: SessionItem[] = newFiles.map((f, idx) => ({
      id: `slide-${Date.now()}-${idx}`, // Unique ID
      status: 'pending', 
      originalFile: f, 
      result: null
    }));
    
    const nextSession = [...session, ...newItems];
    setSession(nextSession);
    runBatchAnalysis(nextSession);
  };

  const removeSlide = (id: string) => {
    const nextSession = session.filter(s => s.id !== id);
    setSession(nextSession);
    
    // Only re-run the Brain analysis if there are still slides left
    if (nextSession.length > 0) {
        // We trick it into running just the Brain report by passing a session with no 'pending' items
        runBatchAnalysis(nextSession); 
    } else {
        setGlobalReport(null);
    }
  };

  const resetSession = () => {
      setSession([]);
      setGlobalReport(null);
      setIsProcessing(false);
      setProgressMsg("");
  };

  return { 
      session, 
      addFiles, 
      removeSlide, 
      isProcessing, 
      progressMsg, 
      globalReport,
      resetSession
  };
};