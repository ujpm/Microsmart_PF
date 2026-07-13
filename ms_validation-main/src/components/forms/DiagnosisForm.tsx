import React, { useState, useEffect } from 'react';
import { Flag, MessageSquare, ArrowRight, CheckCheck } from 'lucide-react';

interface AnnotationData {
  trophozoite_count: number;
  gametocyte_count: number;
  is_flagged: boolean;
  notes: string;
}

interface DiagnosisFormProps {
  initialData?: AnnotationData;
  onSubmit: (data: AnnotationData) => Promise<any>;
  isSubmitting: boolean;
  isLastSlide: boolean;
}

export const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ initialData, onSubmit, isSubmitting, isLastSlide }) => {
  const [trophs, setTrophs] = useState(0);
  const [gametes, setGametes] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setTrophs(initialData.trophozoite_count);
      setGametes(initialData.gametocyte_count);
      setIsFlagged(initialData.is_flagged);
      setNotes(initialData.notes || '');
    } else {
      setTrophs(0);
      setGametes(0);
      setIsFlagged(false);
      setNotes('');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ trophozoite_count: trophs, gametocyte_count: gametes, is_flagged: isFlagged, notes });
  };

  const Counter = ({ label, value, setter, color }: { label: string, value: number, setter: (v: number) => void, color: 'blue' | 'purple' }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setter(val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0));
    };

    const borderClass = value > 0 ? (
      color === 'blue' ? 'border-blue-400 bg-blue-50' : 'border-purple-400 bg-purple-50'
    ) : 'border-slate-200 bg-white';
    
    const inputClass = color === 'blue' ? 'text-blue-600 border-b-blue-200 focus:border-b-blue-500' : 'text-purple-600 border-b-purple-200 focus:border-b-purple-500';
    const buttonClass = color === 'blue' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-purple-100 hover:bg-purple-200 text-purple-700';

    return (
      <div className={`p-3 sm:p-4 rounded-xl border ${borderClass}`}>
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <span className="font-semibold text-slate-800 text-sm sm:text-base">{label}</span>
          <input
            type="number"
            min="0"
            value={value || ''}
            onChange={handleInputChange}
            placeholder="0"
            className={`w-16 sm:w-20 text-right text-lg sm:text-xl font-bold ${inputClass} bg-transparent border-b-2 focus:outline-none p-1 appearance-none`}
            style={{ MozAppearance: 'textfield' }}
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setter(Math.max(0, value - 1))} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-600 transition-colors text-sm">-</button>
          <button type="button" onClick={() => setter(value + 1)} className={`flex-1 py-2 ${buttonClass} rounded-lg font-bold transition-colors text-sm`}>+</button>
        </div>
      </div>
    );
  };

  // Determine button styles based on state
  let buttonStyle = "bg-slate-900 hover:bg-black text-white";
  let buttonText = initialData ? 'Update Records' : 'Save & Continue';
  let ButtonIcon = ArrowRight;

  if (isLastSlide) {
    buttonStyle = "bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-lg";
    buttonText = "Complete Validation Session";
    ButtonIcon = CheckCheck;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 sm:pb-4 mb-4 sm:mb-6 gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Target Quantification</h2>
        <button 
          type="button" 
          onClick={() => setIsFlagged(!isFlagged)}
          className={`flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-colors ${isFlagged ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <Flag size={14} className={isFlagged ? 'fill-red-600' : ''} />
          {isFlagged ? 'Image Flagged' : 'Flag Issue'}
        </button>
      </div>
      
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <Counter label="P. falciparum Trophozoites" value={trophs} setter={setTrophs} color="blue" />
        <Counter label="P. falciparum Gametocytes" value={gametes} setter={setGametes} color="purple" />
      </div>

      <div className="mb-4 sm:mb-6 flex-1">
        <label className="text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2 flex items-center gap-2">
          <MessageSquare size={16} /> Additional Findings / Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-20 sm:h-24 md:h-32 p-2 sm:p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-vertical text-xs sm:text-sm bg-slate-50"
          placeholder="Note other species (e.g., vivax), leukocyte counts, or image quality issues..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${buttonStyle}`}
      >
        {isSubmitting ? 'Processing...' : buttonText}
        {!isSubmitting && <ButtonIcon size={20} />}
      </button>
    </form>
  );
};
