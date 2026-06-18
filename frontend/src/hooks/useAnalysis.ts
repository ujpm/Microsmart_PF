import { useState, useCallback, useRef, useEffect } from 'react';

// Define the shape of our API responses to maintain TypeScript rigor
export interface AnalysisResults {
  session_id: string;
  image_url: string;
  clinical_report: string;
  vision_metrics: {
    annotated_image: string;
    diagnostic_context: string;
    predictions: any[];
    summary_statistics: {
      total_objects_detected: number;
      uninfected_rbc_count?: number;
      wbc_count?: number;
      total_parasite_count?: number;
      estimated_parasitemia_percent?: number;
      species_breakdown?: Record<string, number>;
    };
  };
}

export const useAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  
  // We use a ref to track the timeout so we can cancel it if the user leaves the page
  const pollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup polling if component unmounts
  useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

  const pollResults = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/results/${sessionId}`);
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.status === 'COMPLETED') {
        setResults(data);
        setIsAnalyzing(false);
        setProgressMessage('');
      } else if (data.status === 'ERROR') {
        throw new Error(data.message || 'Background AI processing failed.');
      } else {
        // Still PENDING or PROCESSING. Wait 2.5 seconds and check again.
        setProgressMessage('AI is currently analyzing the clinical data...');
        pollTimeout.current = setTimeout(() => pollResults(sessionId), 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analysis results.');
      setIsAnalyzing(false);
      setProgressMessage('');
    }
  }, []);

  const analyzeFiles = useCallback(async (
    files: File[], 
    options: { mode?: string; engine?: string; sampleType?: string } = {}
  ) => {
    if (!files || files.length === 0) {
      setError("Please select at least one image to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setProgressMessage(`Uploading ${files.length} sample(s) to secure cloud...`);

    try {
      const formData = new FormData();
      // Append MULTIPLE files to the exact same 'files' key
      files.forEach((file) => formData.append('files', file));
      
      formData.append('mode', options.mode || 'full');
      formData.append('engine', options.engine || 'local');
      formData.append('sample_type', options.sampleType || 'malaria');

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
        // Note: Do NOT set Content-Type header manually when using FormData.
        // The browser will automatically set it to multipart/form-data with the correct boundary.
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'PROCESSING' && data.session_id) {
        setProgressMessage('Upload complete. Queuing AI background task...');
        // Start the polling loop
        pollTimeout.current = setTimeout(() => pollResults(data.session_id), 2000);
      } else {
        throw new Error('Unexpected API response format.');
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
      setIsAnalyzing(false);
      setProgressMessage('');
    }
  }, [pollResults]);

  return {
    analyzeFiles,
    isAnalyzing,
    progressMessage,
    error,
    results
  };
};