import React from 'react';
import { ArrowUpRight, Brain, ScanEye, Cpu, Network } from 'lucide-react';
import { BRAND } from '../config';
import { Footer } from '../components/Footer'; // Reusing the general footer
import analysisPreview from '../assets/analysis-preview.jpg';

interface AboutProps {
  onStart: () => void;
}

export const About: React.FC<AboutProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
          
          {/* HERO SECTION */}
          <div className="mb-20 animate-fade-in-up">
            <div className="relative inline-block mb-8">
               <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
               <img src={BRAND.logos.icon} alt="Icon" className="w-16 h-16 relative z-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              MicroSmart <span className="text-cyan-400">PF</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              The premier autonomous agent for <em className="text-slate-200">P. falciparum</em> diagnostics, 
              bridging Computer Vision and Clinical Reasoning.
            </p>
          </div>

          {/* SECTION A: THE AGENT (Visual + Tech) */}
          <div className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 mb-20 backdrop-blur-sm animate-fade-in-up [animation-delay:100ms]">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                
                {/* Visual */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur" />
                  <img 
                    src={analysisPreview} 
                    alt="Agent Analysis View" 
                    className="relative rounded-xl border border-slate-700 shadow-2xl rotate-1 group-hover:rotate-0 transition-transform duration-500" 
                  />
                </div>

                {/* Content */}
                <div className="text-left space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">The Double-Engine Architecture</h2>
                    <p className="text-slate-400 leading-relaxed">
                      MicroSmart PF does not rely on a single model. It orchestrates a conversation between two specialized intelligences.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-950 flex items-center justify-center shrink-0 border border-cyan-900">
                        <ScanEye className="text-cyan-400" size={20} />
                      </div>
                      <div>
                        <h3 className="text-slate-200 font-bold text-sm">The Eye (Vision Agent)</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Powered by <strong className="text-cyan-500">YOLOv8</strong>. 
                          It scans thin blood smears at 40ms/frame to detect and count Trophozoites and Gametocytes with pixel-perfect accuracy.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-950 flex items-center justify-center shrink-0 border border-purple-900">
                        <Brain className="text-purple-400" size={20} />
                      </div>
                      <div>
                        <h3 className="text-slate-200 font-bold text-sm">The Brain (Reasoning Agent)</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Powered by <strong className="text-purple-400">Llama 3.3</strong> on Cerebras. 
                          It interprets the raw counts, calculates parasitemia levels, and generates a clinical pathology report.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* SECTION B: THE ECOSYSTEM */}
          <div className="w-full max-w-3xl mb-20 animate-fade-in-up [animation-delay:200ms]">
            <div className="flex flex-col items-center space-y-6">
               <Network className="text-slate-600" size={32} />
               <h2 className="text-2xl font-bold text-white">The MicroSmart Ecosystem</h2>
               <p className="text-slate-400 text-center leading-relaxed">
                 MicroSmart PF is the specialized malaria node of the larger MicroSmart Project.
                 We are building a constellation of agents for Hematology, Cytology, and Parasitology.
               </p>
               
               <a 
                 href="https://microsmartpf.xyz" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-500 transition-all font-medium text-sm group"
               >
                 Explore the Parent Project
                 <ArrowUpRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
               </a>
            </div>
          </div>

          {/* SECTION C: CREDITS */}
          <div className="border-t border-slate-800 pt-10 pb-10 w-full flex flex-col items-center animate-fade-in-up [animation-delay:300ms]">
             <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-2">
               Architecture & Development
             </span>
             <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
               <Cpu size={14} className="text-cyan-500" />
               <span>Designed by UJPM</span>
             </div>
          </div>

          {/* CTA to Start */}
          <div className="mb-20">
            <button 
              onClick={onStart}
              className="text-cyan-400 hover:text-cyan-300 font-bold text-sm hover:underline underline-offset-4"
            >
              Return to Workbench Initialization &rarr;
            </button>
          </div>

        </main>
        
        {/* GENERAL FOOTER COMPONENT */}
        <Footer />
      </div>
    </div>
  );
};