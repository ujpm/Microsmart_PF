import { useState } from 'react';

export const useAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (file: File, sampleType: string = 'malaria') => {
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      // 1. Initial Upload & Queue
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sample_type', sampleType);
      formData.append('mode', 'full');
      formData.append('engine', 'local');

      const uploadRes = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
        // TODO: Add Authorization Bearer token here when frontend auth is built
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      
      const sessionId = uploadData.session_id;

      // 2. Polling Loop
      let isComplete = false;
      while (!isComplete) {
        // Wait 2 seconds before checking the database again
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        const pollRes = await fetch(`http://localhost:8000/results/${sessionId}`);
        if (!pollRes.ok) throw new Error('Failed to fetch results');
        
        const pollData = await pollRes.json();
        
        if (pollData.status === 'COMPLETED') {
          setResults(pollData);
          isComplete = true;
        } else if (pollData.status === 'ERROR' || pollData.status === 'FAILED') {
          throw new Error(pollData.message || 'Analysis failed during background processing');
        }
        // If status is PENDING or PROCESSING, the loop will run again
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing, results, error };
};