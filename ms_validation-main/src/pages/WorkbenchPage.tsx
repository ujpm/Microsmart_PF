import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useValidation } from '../hooks/useValidation';
import { SlideViewer } from '../components/viewer/SlideViewer';
import { DiagnosisForm } from '../components/forms/DiagnosisForm';
import { HistoryFilmstrip } from '../components/layout/HistoryFilmstrip';
import { Loader, LogOut } from 'lucide-react';

export const WorkbenchPage: React.FC = () => {
  const { sessionId, annotatorName, endSession } = useSession();
  const navigate = useNavigate();
  
  const { 
    currentSlideIndex, 
    totalSlides, 
    currentSlidePath, 
    history,
    isLoading,
    isSubmitting, 
    submitAnnotation,
    goToSlide
  } = useValidation();

  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true });
    }
  }, [sessionId, navigate]);

  if (!sessionId || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const handlePauseSession = () => {
    endSession();
    navigate('/');
  };

  const handleFormSubmit = async (data: any) => {
    const result = await submitAnnotation(data);
    if (result === "COMPLETED") {
      navigate('/complete');
    }
  };

  const completedCount = Object.keys(history).length;
  const progressPercentage = Math.round((completedCount / totalSlides) * 100);

  const currentData = history[currentSlideIndex] ? {
    trophozoite_count: history[currentSlideIndex].trophozoite_count,
    gametocyte_count: history[currentSlideIndex].gametocyte_count,
    is_flagged: history[currentSlideIndex].is_flagged,
    notes: history[currentSlideIndex].notes || ''
  } : undefined;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-2 sm:px-4 md:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-3 sm:gap-0">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">Clinical Validation Workbench</h1>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {annotatorName} • Active Session
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none flex flex-col items-end">
            <span className="text-xs sm:text-sm font-bold text-slate-700 mb-1">
              {completedCount} of {totalSlides}
            </span>
            <div className="w-32 sm:w-48 bg-slate-200 rounded-full h-1.5 sm:h-2">
              <div 
                className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          {completedCount === totalSlides && (
            <button 
              onClick={() => navigate('/complete')}
              className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
              title="Go to completion page"
            >
              Go Finish
            </button>
          )}
          <button 
            onClick={handlePauseSession}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 hover:text-red-600 text-slate-600 rounded-lg font-medium text-xs sm:text-sm transition-colors border border-slate-300 whitespace-nowrap"
            title="Safely pause and return to the login screen"
          >
            <LogOut size={14} className="sm:w-4 sm:h-4" /> Pause & Exit
          </button>
        </div>
      </header>

      <main className="flex-1 p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 max-w-[1600px] mx-auto w-full overflow-hidden">
        <div className="lg:col-span-2 h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
          <SlideViewer slidePath={currentSlidePath} />
        </div>
        <div className="lg:col-span-1 h-full overflow-y-auto">
          <DiagnosisForm 
            initialData={currentData} 
            onSubmit={handleFormSubmit} 
            isSubmitting={isSubmitting} 
            isLastSlide={currentSlideIndex === totalSlides} 
          />
        </div>
      </main>

      <div className="shrink-0">
        <HistoryFilmstrip 
          totalSlides={totalSlides}
          currentIndex={currentSlideIndex}
          history={history}
          onNavigate={goToSlide}
        />
      </div>
    </div>
  );
};
