import { useState } from 'react';

// --- Exported Types ---
export interface VisionResult {
  summary_headline: string;
  total_parasites: number;
  parasitemia_calculation: {
    status: string;
    value: string;
    rbc_count: number;
    note?: string; // Added from backend update
  };
  detailed_counts: Record<string, number>;
  image_url: string; // FIX: Changed from annotated_image (Base64) to URL
  image_metadata?: { width: number; height: number };
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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Helper: Aggregate Data for the Brain
  const calculateAggregate = (items: SessionItem[]) => {
    let totalP = 0;
    let totalRBC = 0;
    const counts: Record<string, number> = { Ring: 0, Trophozoite: 0, Gametocyte: 0, Schizont: 0 };

    items.forEach(item => {
      if (item.result) {
        totalP += item.result.total_parasites;
        // Check if rbc_count exists (it might be in 'rbc_used' or 'rbc_detected' depending on backend version, 
        // but let's stick to the structure we saw in Step 1)
        // In Step 1 backend: rbc_used, rbc_detected. Let's safeguard.
        // For aggregation, we just need a rough estimate or we rely on backend "diagnose" endpoint completely.
        // We will sum the "effective" RBCs if available.
        const rbc = (item.result.parasitemia_calculation as any).rbc_used || item.result.parasitemia_calculation.rbc_count || 0;
        totalRBC += rbc;

        Object.entries(item.result.detailed_counts).forEach(([key, val]) => {
          if (counts[key] !== undefined) counts[key] += val;
        });
      }
    });

    let pct = "N/A";
    if (totalRBC > 0) {
      pct = ((totalP / totalRBC) * 100).toFixed(2) + "%";
    }

    return { totalP, pct, counts };
  };

  const analyzeBatch = async (files: File[]) => {
    setIsProcessing(true);
    setGlobalReport(null);
    
    // 1. Initialize Session
    const newSession: SessionItem[] = files.map((f, idx) => ({
      id: `slide-${Date.now()}-${idx}`,
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
      const brainRes = await fetch(`${API_URL}/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_parasites: stats.totalP,
          parasitemia_pct: stats.pct,
          detailed_counts: stats.counts
        })
      });

      const brainData = await brainRes.json();
      setGlobalReport(brainData.report);
      
    } catch (err) {
      console.error("Brain Failed", err);
      setGlobalReport("Error generating report. Check logs.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  return { session, analyzeBatch, isProcessing, progressMsg, globalReport };
};