import { useState } from 'react';

// --- Exported Types ---
export interface VisionResult {
  summary_headline: string;
  total_parasites: number;
  parasitemia_calculation: {
    status: string;
    value: string;
    rbc_count: number;
  };
  detailed_counts: Record<string, number>;
  annotated_image: string; // URL or Base64
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

  // BULLETPROOF URL: Removes any accidental trailing slashes
  const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const API_URL = rawApiUrl.replace(/\/$/, ""); 

  // Helper: Aggregate Data for the Brain
  const calculateAggregate = (items: SessionItem[]) => {
    let totalP = 0;
    let totalRBC = 0;
    const counts: Record<string, number> = { Ring: 0, Trophozoite: 0, Gametocyte: 0, Schizont: 0 };

    items.forEach(item => {
      if (item.result) {
        totalP += item.result.total_parasites || 0;
        
        // Safely extract RBC count depending on data structure
        if (item.result.parasitemia_calculation?.rbc_count) {
            totalRBC += item.result.parasitemia_calculation.rbc_count;
        }

        if (item.result.detailed_counts) {
            Object.entries(item.result.detailed_counts).forEach(([key, val]) => {
            if (counts[key] !== undefined) counts[key] += val;
            });
        }
      }
    });

    let pct = "N/A";
    if (totalRBC > 0) {
      pct = ((totalP / (totalRBC + totalP)) * 100).toFixed(2) + "%";
    }

    return { totalP, pct, counts };
  };

  const analyzeBatch = async (files: File[]) => {
    setIsProcessing(true);
    setGlobalReport(null);
    
    // 1. Initialize Session
    const newSession: SessionItem[] = files.map((f, idx) => ({
      id: `slide-${idx}`,
      status: 'pending',
      originalFile: f,
      result: null
    }));
    setSession(newSession);

    // 2. Process Loop
    const completedSession = [...newSession]; 

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgressMsg(`Scanning Slide ${i + 1} of ${files.length}...`);

      completedSession[i].status = 'processing';
      setSession([...completedSession]);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_URL}/analyze?mode=vision_only`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        
        completedSession[i].status = 'done';
        completedSession[i].result = data.analysis;
        setSession([...completedSession]);

      } catch (err) {
        console.error(err);
        completedSession[i].status = 'error';
        setSession([...completedSession]);
      }
    }

    // 3. Final Diagnosis
    setProgressMsg("Generating Clinical Report...");
    const stats = calculateAggregate(completedSession);
    
    try {
      console.log("Sending data to Brain Agent:", stats);
      
      const brainRes = await fetch(`${API_URL}/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_parasites: stats.totalP,
          parasitemia_pct: stats.pct,
          detailed_counts: stats.counts
        })
      });

      if (!brainRes.ok) {
          throw new Error(`Backend Error ${brainRes.status}`);
      }

      const brainData = await brainRes.json();
      setGlobalReport(brainData.report);
      
    } catch (err: any) {
      console.error("Brain Failed:", err);
      // This will break the infinite loading screen and show the error text!
      setGlobalReport(`**Connection Error:** Failed to reach the Brain Agent.\n\nDetails: ${err.message}. \n\n*Please press F12 and check the browser Console for CORS or Network errors.*`);
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  return { session, analyzeBatch, isProcessing, progressMsg, globalReport };
};