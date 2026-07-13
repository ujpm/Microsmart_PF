import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabaseClient';
import { useSession } from '../context/SessionContext';

export const useValidation = () => {
  const { sessionId } = useSession();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [history, setHistory] = useState<Record<number, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [slideStartTime, setSlideStartTime] = useState<number>(Date.now());
  const totalSlides = 100;

  // Fetch session history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return;
      try {
        const { data, error } = await supabase
          .from('annotations')
          .select('*')
          .eq('session_id', sessionId);

        if (error) throw error;

        const historyMap: Record<number, any> = {};
        let highestIndex = 0;

        if (data) {
          data.forEach((record: any) => {
            historyMap[record.slide_index] = record;
            if (record.slide_index > highestIndex) highestIndex = record.slide_index;
          });
        }

        setHistory(historyMap);
        // Start them on the next uncompleted slide (or 1 if new)
        setCurrentSlideIndex(highestIndex < totalSlides ? highestIndex + 1 : totalSlides);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [sessionId]);

  // Reset timer on slide change
  useEffect(() => {
    setSlideStartTime(Date.now());
  }, [currentSlideIndex]);

  const submitAnnotation = async (data: { trophozoite_count: number, gametocyte_count: number, is_flagged: boolean, notes: string }) => {
    if (!sessionId) throw new Error("No session");
    setIsSubmitting(true);

    const timeTakenSeconds = Math.round((Date.now() - slideStartTime) / 1000);
    const slideId = `slide_${currentSlideIndex}.jpg`;

    try {
      // Check if we are updating an existing slide or inserting a new one
      const existingRecord = history[currentSlideIndex];

      const payload = {
        session_id: sessionId,
        slide_index: currentSlideIndex,
        slide_id: slideId,
        trophozoite_count: data.trophozoite_count,
        gametocyte_count: data.gametocyte_count,
        is_flagged: data.is_flagged,
        time_taken_seconds: existingRecord ? existingRecord.time_taken_seconds + timeTakenSeconds : timeTakenSeconds,
        notes: data.notes || null
      };

      let savedRecord;

      if (existingRecord) {
        const { data: updated, error } = await supabase
          .from('annotations')
          .update(payload)
          .eq('id', existingRecord.id)
          .select()
          .single();
        if (error) throw error;
        savedRecord = updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('annotations')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        savedRecord = inserted;
      }

      // Update local history cache
      setHistory(prev => ({ ...prev, [currentSlideIndex]: savedRecord }));

      // Move forward if not at the end
      if (currentSlideIndex < totalSlides) {
        setCurrentSlideIndex(prev => prev + 1);
      } else {
        await supabase.from('annotator_sessions')
          .update({ status: 'Completed', end_time: new Date().toISOString() })
          .eq('session_id', sessionId);
        return "COMPLETED";
      }
    } catch (err) {
      console.error("Failed to save:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToSlide = useCallback((index: number) => {
    if (index >= 1 && index <= totalSlides) {
      setCurrentSlideIndex(index);
    }
  }, []);

  return {
    currentSlideIndex,
    totalSlides,
    currentSlidePath: `/slides/slide_${currentSlideIndex}.jpg`,
    history,
    isLoading,
    isSubmitting,
    submitAnnotation,
    goToSlide
  };
};
