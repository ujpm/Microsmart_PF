import { useState, useCallback, useRef, useEffect } from 'react';
import { API_CONFIG } from '../config';

export interface VisionResult {
  summary_statistics?: {
    wbc_count: number;
    species_breakdown: Record<string, number>;
    total_parasite_count: number;
    uninfected_rbc_count: number;
    total_objects_detected: number;
    estimated_parasitemia_percent: number;
  };
  predictions?: {
    x: number;
    y: number;
    width: number;
    height: number;
    class: string;
    class_id: number;
    confidence: number;
    color: string;
  }[];
  annotated_image?: string;
  diagnostic_context?: string;
}

export interface SessionItem {
  id: string;
  originalFile: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: VisionResult;
}

export const useAnalysis = () => {
  const [session, setSession] = useState<SessionItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [globalReport, setGlobalReport] = useState<string | null>(null);
  
  const pollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

  const pollResults = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/results/${sessionId}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();

      if (data.status === 'COMPLETED') {
        setSession(prev => prev.map((slide) => ({
          ...slide,
          status: 'completed',
          result: data.vision_metrics 
        })));
        setGlobalReport(data.clinical_report);
        setIsProcessing(false);
        setProgressMsg('');
      } else if (data.status === 'FAILED' || data.status === 'ERROR') {
        setSession(prev => prev.map(slide => ({ ...slide, status: 'error' })));
        setProgressMsg('AI processing failed.');
        setIsProcessing(false);
      } else {
        setProgressMsg('AI is currently analyzing the clinical data...');
        pollTimeout.current = setTimeout(() => pollResults(sessionId), 2500);
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setProgressMsg('Connection error.');
    }
  }, []);

  const addFiles = useCallback(async (files: File[], engine: 'local' | 'cloud') => {
    if (!files || files.length === 0) return;

    const newItems: SessionItem[] = files.map(f => ({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      originalFile: f,
      status: 'processing'
    }));
    
    setSession(prev => [...prev, ...newItems]);
    setIsProcessing(true);
    setProgressMsg(`Uploading ${files.length} sample(s) to secure cloud...`);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file)); 
      formData.append('mode', 'full');
      formData.append('engine', engine);
      formData.append('sample_type', 'malaria');

      const response = await fetch(`${API_CONFIG.baseUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);
      const data = await response.json();

      if (data.status === 'PROCESSING' && data.session_id) {
        setProgressMsg('Upload complete. Queuing AI background task...');
        pollTimeout.current = setTimeout(() => pollResults(data.session_id), 2000);
      } else {
        throw new Error('Unexpected API response format.');
      }
    } catch (err: any) {
      console.error(err);
      setSession(prev => prev.map(s => newItems.find(n => n.id === s.id) ? { ...s, status: 'error' } : s));
      setIsProcessing(false);
      setProgressMsg('');
    }
  }, [pollResults]);

  const removeSlide = useCallback((id: string) => {
    setSession(prev => prev.filter(item => item.id !== id));
  }, []);

  const resetSession = useCallback(() => {
    setSession([]);
    setGlobalReport(null);
    setIsProcessing(false);
    setProgressMsg('');
    if (pollTimeout.current) clearTimeout(pollTimeout.current);
  }, []);

  return {
    session, addFiles, removeSlide, resetSession, isProcessing, progressMsg, globalReport
  };
};