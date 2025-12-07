import { useState } from 'react';

export interface VisionData {
  counts: Record<string, number>;
  parasitemia_pct: number;
  annotated_image?: string;
}

export interface DiagnosisResult {
  analysis: VisionData;
  report: string;
}

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (file: File) => {
    setLoading(true);
    setError(null);
    
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
      return data; // Return data so the caller can use it (e.g., to update preview)
    } catch (err) {
      setError("Error processing sample.");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, result, loading, error, reset: () => setResult(null) };
}