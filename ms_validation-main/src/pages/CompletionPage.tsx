import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useSession } from '../context/SessionContext';
import { SignaturePad } from '../components/reports/SignaturePad';
import { PdfTemplate } from '../components/reports/PdfTemplate';
import { CheckCircle, Download, FileText, Loader, LogOut } from 'lucide-react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';

export const CompletionPage: React.FC = () => {
  const { sessionId, endSession } = useSession();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const { data: session } = await supabase
          .from('annotator_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single();
        
        const { data: annos } = await supabase
          .from('annotations')
          .select('*')
          .eq('session_id', sessionId)
          .order('slide_index', { ascending: true }); // Order sequentially 1 to 100

        setSessionData(session);
        setAnnotations(annos || []);
      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, navigate]);

  const handleExportCSV = () => {
    // Map to the new numerical database schema
    const csvData = annotations.map(a => ({
      slide_index: a.slide_index,
      slide_id: a.slide_id,
      trophozoite_count: a.trophozoite_count,
      gametocyte_count: a.gametocyte_count,
      is_flagged: a.is_flagged ? 'Yes' : 'No',
      time_taken_seconds: a.time_taken_seconds,
      notes: a.notes || '',
      timestamp: new Date(a.created_at).toISOString()
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `microsmart_counts_${sessionData?.annotator_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!signatureUrl) {
      alert("Please provide your digital signature to authorize the PDF generation.");
      return;
    }

    const element = reportRef.current;
    if (!element) return;

    const opt: any = {
      margin: 0,
      filename: `microsmart_report_${sessionData?.annotator_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleExit = () => {
    endSession();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-12 px-3 sm:px-4 relative">
      {/* Top Bar Exit Button */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-6">
         <button onClick={handleExit} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-xs sm:text-sm">
            <LogOut size={16} className="sm:w-5 sm:h-5" /> Logout
         </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm text-center border border-slate-200">
          <div className="flex justify-center mb-3 sm:mb-4">
            <CheckCircle size={56} className="text-green-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Validation Complete</h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Thank you, {sessionData?.annotator_name}. You have successfully evaluated {annotations.length} slides.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Raw Data (CSV)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
                Download the flat dataset containing exact cell counts, slide indices, and time metrics for AI statistical analysis.
              </p>
            </div>
            <button 
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2 sm:py-3 rounded-lg hover:bg-slate-900 transition-colors text-sm sm:text-base"
            >
              <Download size={16} className="sm:w-5 sm:h-5" /> Download Dataset
            </button>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <CheckCircle size={18} className="text-blue-600" />
              Audit Report (PDF)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
              Sign below to generate the formal, visually formatted validation report for your dissertation appendix.
            </p>
            
            <div className="mb-3 sm:mb-4">
              <SignaturePad onSave={setSignatureUrl} />
            </div>

            <button 
              onClick={handleExportPDF}
              disabled={!signatureUrl}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <Download size={16} className="sm:w-5 sm:h-5" /> Generate Signed PDF
            </button>
          </div>
        </div>

        <PdfTemplate 
          ref={reportRef} 
          sessionData={sessionData} 
          annotations={annotations} 
          signatureUrl={signatureUrl} 
        />
      </div>
    </div>
  );
};
