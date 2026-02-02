import React from 'react';
import { Github, Twitter, Linkedin, Globe, Cpu, Microscope, Activity, Dna } from 'lucide-react';
import { BRAND } from '../config';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* COLUMN 1: BRAND & SOCIAL */}
          <div className="md:col-span-2 space-y-6">
             <div className="flex items-center gap-2">
                <img src={BRAND.logos.icon} alt="Logo" className="w-8 h-8 opacity-80" />
                <span className="font-bold text-slate-200 tracking-tight">MICROSMART <span className="text-cyan-400">PF</span></span>
             </div>
             <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
               Autonomous diagnostic interface for *P. falciparum* malaria, bridging high-speed computer vision with clinical reasoning.
             </p>
             
             {/* Social Links */}
             <div className="flex items-center gap-4">
               {/* GitHub */}
               <a href="#" className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800">
                 <Github size={18} />
               </a>
               
               {/* Parent Project */}
               <a 
                 href="https://microsmartpf.xyz" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="p-2 rounded-full bg-slate-900 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-all border border-cyan-900/30 shadow-[0_0_10px_-3px_rgba(34,211,238,0.2)]"
                 title="MicroSmart Parent Project"
               >
                 <Globe size={18} />
               </a>

               {/* Twitter / X */}
               <a href="#" className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800">
                 <Twitter size={18} />
               </a>
               
               {/* LinkedIn */}
               <a href="#" className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800">
                 <Linkedin size={18} />
               </a>
             </div>
          </div>

          {/* COLUMN 2: THE AGENT SUITE (Quick Links) */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-6">Agent Constellation</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="group flex items-center gap-2 text-sm text-cyan-400 font-medium">
                  <Microscope size={14} />
                  <span>MicroSmart PF</span>
                  <span className="ml-auto text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">ACTIVE</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-not-allowed">
                  <Activity size={14} />
                  <span>MicroSmart Heme</span>
                  <span className="ml-auto text-[10px] text-slate-600">SOON</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-not-allowed">
                  <Dna size={14} />
                  <span>MicroSmart Cyto</span>
                  <span className="ml-auto text-[10px] text-slate-600">R&D</span>
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: RESOURCES */}
          <div>
             <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-6">Resources</h3>
             <ul className="space-y-3 text-sm text-slate-500">
               <li><a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
               <li><a href="#" className="hover:text-cyan-400 transition-colors">Model Card (YOLOv8)</a></li>
               <li><a href="#" className="hover:text-cyan-400 transition-colors">System Status</a></li>
               <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
             </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="text-xs text-slate-600">
             © 2026 MicroSmart Inc. All rights reserved. 
             <span className="hidden md:inline mx-2">|</span> 
             <span className="text-slate-500">Research Use Only. Not for clinical diagnosis.</span>
          </div>

          {/* DESIGNED BY UJPM */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
             <Cpu size={14} className="text-cyan-500" />
             <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
               Designed by <span className="text-slate-200 font-bold">UJPM</span>
             </span>
          </div>

        </div>
      </div>
    </footer>
  );
};