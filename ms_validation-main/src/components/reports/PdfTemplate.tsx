import { forwardRef } from 'react';

interface PdfTemplateProps {
  sessionData: any;
  annotations: any[];
  signatureUrl: string | null;
}

export const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(
  ({ sessionData, annotations, signatureUrl }, ref) => {
    
    const total = annotations.length;
    const flagged = annotations.filter(a => a.is_flagged).length;
    const totalTrophs = annotations.reduce((sum, a) => sum + (a.trophozoite_count || 0), 0);
    const totalGametes = annotations.reduce((sum, a) => sum + (a.gametocyte_count || 0), 0);

    return (
      <div className="hidden">
        {/* We use inline Hex colors specifically to prevent html2canvas oklch parsing crashes */}
        <div ref={ref} className="p-10 font-sans" style={{ width: '800px', minHeight: '1100px', backgroundColor: '#ffffff', color: '#000000' }}>
          
          <div className="pb-6 mb-8 flex justify-between items-end" style={{ borderBottom: '2px solid #1e293b' }}>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">MicroSmart PF</h1>
              <p className="text-lg" style={{ color: '#475569' }}>Phase 1: Ground Truth Audit Report</p>
            </div>
            <div className="text-right text-sm" style={{ color: '#64748b' }}>
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Session ID: {sessionData?.session_id?.substring(0, 8) || 'N/A'}</p>
            </div>
          </div>

          <div className="p-6 rounded mb-8" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h2 className="text-lg font-bold mb-4 pb-2" style={{ borderBottom: '1px solid #e2e8f0' }}>Annotator Profile</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Name:</span> {sessionData?.annotator_name}</div>
              <div><span className="font-semibold">Credentials:</span> {sessionData?.credentials}</div>
              <div><span className="font-semibold">Start Time:</span> {sessionData?.start_time ? new Date(sessionData?.start_time).toLocaleString() : 'N/A'}</div>
              <div><span className="font-semibold">End Time:</span> {sessionData?.end_time ? new Date(sessionData?.end_time).toLocaleString() : 'N/A'}</div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-lg font-bold mb-4 pb-2" style={{ borderBottom: '1px solid #e2e8f0' }}>Quantification Summary</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded" style={{ backgroundColor: '#f1f5f9' }}>
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Slides Evaluated</div>
              </div>
              <div className="p-4 rounded" style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #dbeafe' }}>
                <div className="text-2xl font-bold">{totalTrophs}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Total Trophozoites</div>
              </div>
              <div className="p-4 rounded" style={{ backgroundColor: '#faf5ff', color: '#581c87', border: '1px solid #f3e8ff' }}>
                <div className="text-2xl font-bold">{totalGametes}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Total Gametocytes</div>
              </div>
              <div className="p-4 rounded" style={{ backgroundColor: '#fef2f2', color: '#7f1d1d', border: '1px solid #fee2e2' }}>
                <div className="text-2xl font-bold">{flagged}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Flagged Issues</div>
              </div>
            </div>
          </div>

          <div className="mb-16 text-sm leading-relaxed" style={{ color: '#475569' }}>
            <h3 className="font-bold mb-2" style={{ color: '#000000' }}>Methodology Declaration</h3>
            <p>
              This document certifies the completion of a blinded ground-truth validation session. 
              The annotator evaluated {total} anonymized microscopy images. The specific numerical quantification 
              recorded herein will serve as the baseline dataset for evaluating the MicroSmart computer vision agent. 
              By signing below, the annotator confirms that these classifications and counts were made 
              to the best of their professional ability.
            </p>
          </div>

          <div className="mt-auto pt-10 flex justify-between items-end" style={{ borderTop: '1px solid #cbd5e1' }}>
            <div className="w-64">
              {signatureUrl ? (
                <img src={signatureUrl} alt="Signature" className="h-16 mb-2 object-contain" style={{ borderBottom: '1px solid #000000' }} />
              ) : (
                <div className="h-16 mb-2" style={{ borderBottom: '1px solid #000000' }}></div>
              )}
              <p className="text-xs text-center font-bold" style={{ color: '#000000' }}>{sessionData?.annotator_name}</p>
              <p className="text-xs text-center" style={{ color: '#64748b' }}>Principal Annotator</p>
            </div>
            <div className="w-64">
              <div className="h-16 mb-2" style={{ borderBottom: '1px solid #000000' }}></div>
              <p className="text-xs text-center font-bold" style={{ color: '#000000' }}>Principal Investigator</p>
              <p className="text-xs text-center" style={{ color: '#64748b' }}>Countersignature</p>
            </div>
          </div>

        </div>
      </div>
    );
  }
);
