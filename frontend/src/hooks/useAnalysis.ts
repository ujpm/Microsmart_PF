import { useState } from 'react';

// Vite requires VITE_ prefix for environment variables to be accessible in the browser.
// In Codespaces, this must be the full HTTPS URL from your Ports tab.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sends the blood smear image to the backend for AI analysis.
   */
  const analyze = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`Connecting to: ${API_URL}/analyze`);
      
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Capture specific backend errors (like model missing or API keys failing)
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error('Frontend Fetch Error:', err);
      setError(err.message || 'Connection refused. Check if the backend is running and public.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setError(null);
  };

  // Return function as 'analyze' to match your App.tsx handleAnalyzeClick call.
  return { analyze, loading, results, error, reset };
};