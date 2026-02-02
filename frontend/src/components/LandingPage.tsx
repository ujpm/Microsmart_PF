import React from 'react';
import { Eye, Brain, ArrowRight, Activity, Microscope } from 'lucide-react';
import { Footer } from './Footer';

interface LandingPageProps {
  onStart: () => void;
  children?: React.ReactNode; // FIX: Added children prop
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden custom-scrollbar">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center font-bold text-slate-950">PF</div>
          <span className="text-xl font-bold tracking-tight">MICROSMART <span className="text-cyan-400">PF AGENT</span></span>
        </div>
        <div className="text-xs font-mono text-slate-500">RESEARCH PREVIEW v1.2</div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 py-20">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-bold mb-8 animate-fade-in-up">
          <Activity size={14} />
          <span>AUTONOMOUS AGENT ACTIVE</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 animate-fade-in-up [animation-delay:100ms]">
          The Future of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            Malaria Diagnostics
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed animate-fade-in-up [animation-delay:200ms]">
          A collaborative AI system combining high-speed Computer Vision (YOLOv8) 
          with Clinical Reasoning (Llama 3.3) for <em>P. falciparum</em> detection.
        </p>

        <button 
          onClick={onStart}
          className="group relative px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_-15px_rgba(34,211,238,0.6)] animate-fade-in-up [animation-delay:300ms]"
        >
          <span className="flex items-center gap-2">
            Initialize Workbench
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 mb-20 max-w-5xl w-full animate-fade-in-up [animation-delay:500ms]">
          {[
            { 
              icon: <Eye className="text-cyan-400" />, 
              title: "Vision Agent", 
              desc: "Real-time cell segmentation & counting." 
            },
            { 
              icon: <Brain className="text-purple-400" />, 
              title: "Brain Agent", 
              desc: "Clinical interpretation via Cerebras Inference." 
            },
            { 
              icon: <Microscope className="text-emerald-400" />, 
              title: "Hardware Ready", 
              desc: "Optimized for OpenFlexure streams." 
            }
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm hover:border-slate-700 transition-colors text-left">
              <div className="mb-4 bg-slate-950 w-12 h-12 rounded-lg flex items-center justify-center border border-slate-800">
                {item.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FIX: Render Children (UploadZone) HERE, before Footer */}
        {children && (
          <div className="w-full animate-fade-in-up [animation-delay:600ms]">
            {children}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};