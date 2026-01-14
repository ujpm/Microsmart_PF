import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null); // Plural state name
  const [error, setError] = useState<string | null>(null);

  const analyze = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setResults(data);
      return data; // CRITICAL: Return the data so App.tsx can use it
    } catch (err: any) {
      setError(err.message || 'Connection refused.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setError(null);
  };

  // Return "results" (plural)
  return { analyze, loading, results, error, reset };
};