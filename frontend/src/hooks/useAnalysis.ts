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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const calculateAggregate = (items: SessionItem[]) => {
    let totalP = 0; let totalRBC = 0;
    const counts: Record<string, number> = { Ring: 0, Trophozoite: 0, Gametocyte: 0, Schizont: 0 };

    items.forEach(item => {
      if (item.result) {
        totalP += item.result.total_parasites;
        totalRBC += item.result.parasitemia_calculation.rbc_count;
        Object.entries(item.result.detailed_counts).forEach(([key, val]) => {
          if (counts[key] !== undefined) counts[key] += val;
        });
      }
    });

    let pct = "N/A";
    if (totalRBC > 0) pct = ((totalP / (totalRBC + totalP)) * 100).toFixed(2) + "%";
    return { totalP, pct, counts };
  };

  const analyzeBatch = async (files: File[]) => {
    setIsProcessing(true);
    setGlobalReport(null);
    
    const newSession: SessionItem[] = files.map((f, idx) => ({
      id: `slide-${idx}`, status: 'pending', originalFile: f, result: null
    }));
    setSession(newSession);

    const completedSession = [...newSession]; 

    for (let i = 0; i < files.length; i++) {
      setProgressMsg(`Scanning Slide ${i + 1} of ${files.length}...`);
      completedSession[i].status = 'processing';
      setSession([...completedSession]);

      try {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch(`${API_URL}/analyze?mode=vision_only`, { method: "POST", body: formData });
        if (!res.ok) throw new Error("API Error");
        
        const data = await res.json();
        completedSession[i].status = 'done';
        completedSession[i].result = data.analysis;
      } catch (err) {
        completedSession[i].status = 'error';
      }
      setSession([...completedSession]);
    }

    setProgressMsg("Generating Clinical Report...");
    const stats = calculateAggregate(completedSession);
    
    try {
      const brainRes = await fetch(`${API_URL}/diagnose`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_parasites: stats.totalP, parasitemia_pct: stats.pct, detailed_counts: stats.counts })
      });
      const brainData = await brainRes.json();
      setGlobalReport(brainData.report);
    } catch (err) {
      setGlobalReport("Error generating report.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  return { session, analyzeBatch, isProcessing, progressMsg, globalReport };
};