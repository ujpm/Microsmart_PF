import { useState } from 'react';
import { API_CONFIG } from '../config';

export interface VisionResult {
  summary_headline: string;
  total_parasites: number;
  parasitemia_calculation: {
    status: string;
    value: string;
    rbc_count: number;
    note?: string; 
  };
  detailed_counts: Record<string, number>;
  image_url: string; 
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

  // Helper to process a specific list of items (used for initial load and appending)
  const processQueue = async (itemsToProcess: SessionItem[], startIndex: number) => {
    setIsProcessing(true);
    setGlobalReport(null);

    // We process sequentially to avoid overwhelming the browser/server
    for (let i = 0; i < itemsToProcess.length; i++) {
      const currentItem = itemsToProcess[i];
      const globalIndex = startIndex + i; 
      const file = currentItem.originalFile;

      setProgressMsg(`Scanning Slide ${globalIndex + 1}...`);

      // Update status to 'processing'
      setSession(prev => prev.map(item => 
        item.id === currentItem.id ? { ...item, status: 'processing' } : item
      ));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_CONFIG.baseUrl}/analyze?mode=vision_only`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        
        // Update status to 'done'
        setSession(prev => prev.map(item => 
          item.id === currentItem.id ? { ...item, status: 'done', result: data.analysis } : item
        ));

      } catch (err) {
        console.error(err);
        setSession(prev => prev.map(item => 
          item.id === currentItem.id ? { ...item, status: 'error' } : item
        ));
      }
    }

    setIsProcessing(false);
    setProgressMsg("");
  };

  // 1. Initial Batch Analysis (Replaces Session)
  const analyzeBatch = (files: File[]) => {
    const newItems: SessionItem[] = files.map((f, idx) => ({
      id: `slide-${Date.now()}-${idx}`,
      status: 'pending',
      originalFile: f,
      result: null
    }));
    setSession(newItems);
    processQueue(newItems, 0);
  };

  // 2. Append Files (Adds to Session)
  const addFiles = (files: File[]) => {
    const startIdx = session.length;
    const newItems: SessionItem[] = files.map((f, idx) => ({
      id: `slide-${Date.now()}-${startIdx + idx}`,
      status: 'pending',
      originalFile: f,
      result: null
    }));
    
    setSession(prev => [...prev, ...newItems]);
    processQueue(newItems, startIdx);
  };

  // 3. Remove Slide
  const removeSlide = (idToDelete: string) => {
    setSession(prev => prev.filter(item => item.id !== idToDelete));
  };

  const resetSession = () => {
    setSession([]);
    setGlobalReport(null);
    setIsProcessing(false);
  };

  return { session, analyzeBatch, addFiles, removeSlide, isProcessing, progressMsg, globalReport, resetSession };
};