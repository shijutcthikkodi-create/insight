
import React from 'react';
import { Info, Target, Shield, Cpu, Scale, Brain } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16 animate-in fade-in duration-700">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-blue-500/20">
          <Info size={32} className="text-blue-500" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">About Us</h2>
        <p className="text-slate-500 mt-2 font-mono text-[10px] uppercase tracking-[0.2em]">Institutional Infrastructure • Decision Support • Education</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden h-full">
           <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
           <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Cpu size={20} /></div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Our Framework</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium mb-4">
                Libra Fin-Tech Solutions is a market-technology company focused on developing structured tools and frameworks that help traders understand market behavior and plan trades with discipline and risk awareness.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Built on over 17 years of practical market experience, the platform offers a secure, organized, and technology-driven alternative to unstructured trading communication. It provides strategy-based market insights, execution planning tools, and rule-driven frameworks designed to support independent decision-making.
              </p>
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden h-full">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
           <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                 <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Target size={20} /></div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Our Mission</h3>
              </div>
              <p className="text-slate-300 text-lg font-bold leading-snug tracking-tight mb-6">
                To build a professional trading technology platform that enables informed, independent decision-making through structured market frameworks and disciplined execution planning.
              </p>
              <div className="space-y-4">
                 {[
                   "Process Integrity & Transparency",
                   "Disciplined Risk Management",
                   "Responsible Market Participation",
                   "Structured Thinking Over Speculation"
                 ].map((item, i) => (
                   <div key={i} className="flex items-center space-x-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span>{item}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Why Insight App Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center space-x-3 mb-6">
           <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Brain size={20} />
           </div>
           <h3 className="text-sm font-black text-white uppercase tracking-widest">Why Insight App?</h3>
        </div>
        
        <p className="text-slate-400 text-sm leading-relaxed font-medium mb-8">
          The Insight App is designed as an interactive simulator and structured decision-support utility. Our primary purpose is to promote advanced risk awareness and systematic paper-trading practice. This focus on education and mental discipline acts as a strong protective framework to comply with modern retail protection objectives.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl space-y-3 hover:border-slate-700/50 transition-colors">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">Practice to Control Mind</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                 Cultivate mental discipline and mechanical emotional control. By logging, checking, and analyzing simulated trading strategies, users train themselves to neutralize greed, fear, and overtrading.
              </p>
           </div>

           <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl space-y-3 hover:border-slate-700/50 transition-colors">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Practice to Reduce Risk</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                 Gain deep awareness of risk-to-reward dynamics. Learn how specific stop-loss guidelines, position sizing rules, and target placements directly influence your performance profile over time.
              </p>
           </div>

           <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl space-y-3 hover:border-slate-700/50 transition-colors">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Protect Capital with Paper Trade</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                 Harness simulation tools to run robust paper trades. Verify setup metrics and test strategies in a risk-free workspace, fully protecting your financial capital until consistency is achieved.
              </p>
           </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Scale size={14} className="text-blue-500" />
              <span>Strong Regulatory Protection Compliance</span>
           </div>
           <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
              We stand firmly behind regulatory guidelines that prioritize retail protection. Offering non-advisory, education-first utilities and detailed simulation environments safeguards users from speculative dangers and builds long-term capability.
           </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
         <div className="flex items-start space-x-6 mb-8">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 shrink-0"><Shield size={24} /></div>
            <div>
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Platform Operation</h3>
               <p className="text-slate-400 text-sm leading-relaxed font-medium">
                 Libra Fin-Tech Solutions operates as a decision-support and educational platform. The company does not provide investment advice, does not manage client funds, and does not execute trades on behalf of users. All content shared represents research-oriented views and system-based observations, intended strictly for educational and informational purposes.
               </p>
            </div>
         </div>
         
         <div className="pt-8 border-t border-slate-800">
            <div className="flex items-center space-x-3 mb-4">
               <Scale size={18} className="text-slate-500" />
               <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Regulatory Disclosure</h3>
            </div>
            <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
               <p className="text-rose-400 text-xs font-bold leading-relaxed">
                 Libra Fin-Tech Solutions is not registered with SEBI as an Investment Advisor or Research Analyst. Trading in financial markets involves risk, and past performance or system references do not guarantee future outcomes.
               </p>
            </div>
         </div>
      </div>

      <div className="text-center pt-4">
         <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] font-mono">
            Libra Fin-Tech Solutions • Est. 17+ Years Market Experience
         </p>
      </div>
    </div>
  );
};

export default About;
