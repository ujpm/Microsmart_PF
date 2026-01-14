import React from 'react';
import { Eye, Brain, ArrowRight, ShieldCheck } from 'lucide-react';
import microscopeImg from '../assets/microscope-setup.jpg';
import analysisImg from '../assets/analysis-preview.jpg';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-6">
            BETA VERSION 1.1.0
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Autonomous Multi-Agent <br /><span className="text-blue-600">Parasite Analysis</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            MicroSmart PF is a research-focused autonomous agent designed to identify 
            <em> Plasmodium falciparum</em> using a collaborative AI architecture.
          </p>
          <button 
            onClick={onStart}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center mx-auto shadow-lg shadow-blue-200"
          >
            Start Research Analysis <ArrowRight className="ml-2" />
          </button>
        </div>
      </section>

      {/* Z-Pattern Section 1: The Eye */}
      <section className="py-20 border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Eye className="text-blue-600" size={28} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Eye: YOLOv8 Vision</h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Our first agent utilizes high-speed computer vision to scan thin blood smears. 
              By adapting standard microscopes with mobile hardware, "The Eye" identifies 
              individual cells and parasites with millisecond precision.
            </p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center"><ShieldCheck className="text-green-500 mr-2" size={18} /> High-sensitivity ring-stage detection</li>
              <li className="flex items-center"><ShieldCheck className="text-green-500 mr-2" size={18} /> Automated parasitemia quantification</li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
            <img src={microscopeImg} alt="Microscope Setup" className="w-full object-cover h-[400px]" />
          </div>
        </div>
      </section>

      {/* Z-Pattern Section 2: The Brain */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
            <img src={analysisImg} alt="AI Detection Analysis" className="w-full object-cover h-[400px]" />
          </div>
          <div className="order-1 md:order-2">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Brain className="text-purple-600" size={28} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Brain: Cerebras Reasoning</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              The raw data from The Eye is passed to "The Brain"—an autonomous reasoning agent 
              powered by Llama 3.3 via the Cerebras platform. It interprets cell counts and 
              morphology to provide a comprehensive research assessment following standardized guidelines.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};