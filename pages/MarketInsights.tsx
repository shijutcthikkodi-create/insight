
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, Activity, BarChart3, Target, Clock, ShieldCheck, Flame, Timer, Shield, Users, Lock, History } from 'lucide-react';
import { InsightData, WatchlistItem } from '../types';

interface MarketInsightsProps {
  insights?: InsightData[];
  watchlist?: WatchlistItem[];
}

type TabID = 'TREND' | 'DOMINANCE' | 'FLOW';

const isBullish = (val: any): boolean => {
  const s = String(val || '').trim().toUpperCase();
  return ['BULLISH', 'BULL', 'BUY', 'UP', 'ACC'].includes(s);
};

const isBearish = (val: any): boolean => {
  const s = String(val || '').trim().toUpperCase();
  return ['BEARISH', 'BEAR', 'SELL', 'DOWN', 'DIS'].includes(s);
};

const isNeutral = (val: any): boolean => {
  const s = String(val || '').trim().toUpperCase();
  return ['NEUTRAL', 'NUTRAL', 'NEUT', 'SIDE', 'FLAT', 'BAL', 'SIDEWAYS', 'INDECISION'].includes(s);
};

const isHfr = (val: any): boolean => {
  const s = String(val || '').trim().toUpperCase();
  return ['H-FR', 'HFR', 'HIGH FREQUENCY', 'FAST'].includes(s);
};

const getDurationLabel = (category?: string) => {
  const c = String(category || '').trim().toUpperCase();
  if (c.includes('SHORT')) return '1 to 20 Days';
  if (c.includes('MEDIUM')) return '1 Month to 6 Months';
  if (c.includes('LONG')) return '1 Year to 5 Years';
  return '';
};

const formatOnlyDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return dateStr.split(/[ T]/)[0];
};

const parseSymbol = (symbolStr: string) => {
  if (symbolStr.includes(',')) {
    const [name] = symbolStr.split(',').map(s => s.trim());
    return { name };
  }
  return { name: symbolStr };
};

const checkProtectionHit = (insight: InsightData, watchlist: WatchlistItem[]): boolean => {
  if (insight.isDead) return true;
  const { symbol, sentiment, protection, cmp: directCmp } = insight;
  const { name } = parseSymbol(symbol);
  
  const isBull = isBullish(sentiment);
  const isBear = isBearish(sentiment);
  
  const watchItem = watchlist.find(w => w.symbol.toUpperCase().includes(name.toUpperCase()));
  const currentPrice = directCmp || (watchItem ? watchItem.price : null);
  const protectionPrice = protection || null;

  if (protectionPrice === null || currentPrice === null) return false;

  return (isBull && currentPrice <= protectionPrice) || (isBear && currentPrice >= protectionPrice);
};

const MarketInsights: React.FC<MarketInsightsProps> = ({ insights = [], watchlist = [] }) => {
  const [activeTab, setActiveTab] = useState<TabID>('TREND');
  const [highlightedSymbol, setHighlightedSymbol] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs = [
    { id: 'TREND' as TabID, label: 'Trend', icon: TrendingUp },
    { id: 'DOMINANCE' as TabID, label: 'Participants', icon: Users },
    { id: 'FLOW' as TabID, label: 'Flow', icon: Activity }
  ];

  // Sorting logic helper: Active first, Protected at bottom
  const sortProtectedToBottom = (data: InsightData[]) => {
    return [...data].sort((a, b) => {
      const aProtected = checkProtectionHit(a, watchlist);
      const bProtected = checkProtectionHit(b, watchlist);
      if (aProtected && !bProtected) return 1;
      if (!aProtected && bProtected) return -1;
      return 0;
    });
  };

  const trendData = useMemo(() => {
    const base = insights.filter(i => i.type === 'TREND' || !!i.sentiment);
    return sortProtectedToBottom(base);
  }, [insights, watchlist]);

  const participantsData = useMemo(() => {
    const base = insights.filter(i => i.type === 'DOMINANCE' || (!!i.category && !!i.sentiment));
    return sortProtectedToBottom(base);
  }, [insights, watchlist]);

  const flowData = useMemo(() => insights.filter(i => i.type === 'FLOW' || !!i.pattern || !!i.phase), [insights]);

  const handleAssetClick = (symbol: string) => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    setHighlightedSymbol(symbol);
    setActiveTab(prev => prev === 'TREND' ? 'DOMINANCE' : 'TREND');

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedSymbol(null);
    }, 1600);
  };

  useEffect(() => {
    if (highlightedSymbol && (activeTab === 'TREND' || activeTab === 'DOMINANCE')) {
      const timer = setTimeout(() => {
        const elementId = `${activeTab.toLowerCase() === 'dominance' ? 'participants' : activeTab.toLowerCase()}-${highlightedSymbol}`;
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, highlightedSymbol]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h2 className="text-2xl font-black text-white mb-1 flex items-center tracking-tighter">
              <Flame size={24} className="mr-3 text-rose-500 animate-pulse" />
              ALPHA TERMINAL
            </h2>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em] flex items-center">
              <ShieldCheck className="mr-1.5 text-blue-500" size={10} /> Quantum Insight Engine
            </p>
          </div>
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
            <Clock size={12} className="text-blue-500" />
            <span className="uppercase font-black tracking-widest">LIVE DATA SYNC</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/50 backdrop-blur-md rounded-[20px] border border-slate-800 shadow-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setHighlightedSymbol(null); 
              }}
              className={`flex flex-col sm:flex-row items-center justify-center py-3 px-2 rounded-[16px] transition-all duration-300 group relative overflow-hidden ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} className={`mb-1 sm:mb-0 sm:mr-3 ${activeTab === tab.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px] animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'TREND' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trendData.length > 0 ? trendData.map((d, i) => {
              const { name } = parseSymbol(d.symbol);
              return (
                <TrendStrengthCard 
                  key={i} 
                  insight={d}
                  watchlist={watchlist}
                  isHighlighted={highlightedSymbol === name}
                  onSelect={() => handleAssetClick(name)}
                />
              );
            }) : (
              <div className="md:col-span-2 text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Scanning Trend Map...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'DOMINANCE' && (
          <div className="space-y-2.5">
            {participantsData.length > 0 ? participantsData.map((d, i) => {
              const { name } = parseSymbol(d.symbol);
              return (
                <ParticipantLogicRow 
                  key={i} 
                  insight={d}
                  watchlist={watchlist}
                  isHighlighted={highlightedSymbol === name}
                  onSelect={() => handleAssetClick(name)}
                />
              );
            }) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Awaiting Participant Logic...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'FLOW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flowData.length > 0 ? flowData.map((d, i) => {
              const { name } = parseSymbol(d.symbol);
              return (
                <FlowPatternCard 
                  key={i} 
                  insight={d}
                  isHighlighted={highlightedSymbol === name}
                />
              );
            }) : (
              <div className="md:col-span-2 text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Detecting Flow Patterns...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TrendStrengthCardProps {
  insight: InsightData;
  watchlist?: WatchlistItem[];
  isHighlighted?: boolean;
  onSelect?: () => void;
}

const TrendStrengthCard: React.FC<TrendStrengthCardProps> = ({ insight, watchlist = [], isHighlighted, onSelect }) => {
  const { symbol, sentiment, strength = 50, viewOrigin, protection, cmp: directCmp, date } = insight;
  const { name } = parseSymbol(symbol);
  
  const isBull = isBullish(sentiment);
  const isBear = isBearish(sentiment);
  const isNeut = isNeutral(sentiment);
  
  const watchItem = watchlist.find(w => w.symbol.toUpperCase().includes(name.toUpperCase()));
  const originPrice = viewOrigin || null; 
  const currentPrice = directCmp || (watchItem ? watchItem.price : null);
  const protectionPrice = protection || null;
  const cleanDate = formatOnlyDate(date);

  const isProtectionHit = checkProtectionHit(insight, watchlist);

  const status = isProtectionHit ? "Level Invalidated" : isBull ? "Active Buyers" : isBear ? "Active Sellers" : isNeut ? "Consolidation" : "Neutral";
  const displaySentiment = isProtectionHit ? 'PROTECTED' : isBull ? 'BULLISH' : isBear ? 'BEARISH' : isNeut ? 'NEUTRAL' : (sentiment?.toUpperCase() || 'MONITORING');
  
  const priceDiff = (currentPrice !== null && originPrice !== null) ? (currentPrice - originPrice) : null;

  const isPositiveOutcome = isBear 
    ? (priceDiff !== null && priceDiff <= 0) 
    : (priceDiff !== null && priceDiff >= 0);

  return (
    <div 
      id={`trend-${name}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      className={`bg-slate-900 border rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all duration-500 cursor-pointer group/card
        ${isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/20 animate-box-glow scale-[1.02] z-10' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'}
        ${isProtectionHit ? 'opacity-30 grayscale-[0.8]' : ''}
      `}
    >
      {/* PROTECTION OVERLAY STAMP */}
      {isProtectionHit && (
        <div className="absolute inset-0 z-[10] bg-slate-950/20 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
           <div className="status-stamp text-rose-500 scale-[0.8]">
              <div className="flex flex-col items-center">
                 <span className="text-xl tracking-[0.2em]">PROTECTED</span>
                 <div className="flex items-center mt-0.5 space-x-1">
                    <History size={10} />
                    <span className="text-[8px] font-bold opacity-60 uppercase">LEVEL INVALIDATED</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4 pointer-events-none">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black text-white tracking-tighter font-mono leading-none uppercase group-hover/card:text-blue-400 transition-colors">
                {name}
              </span>
              {cleanDate && (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{cleanDate}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              {originPrice !== null && (
                <div className="flex items-center space-x-1.5 bg-slate-950/50 px-2 py-0.5 rounded-lg border border-slate-800">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">FROM-</span>
                  <span className="text-[10px] font-mono font-black text-slate-200">₹{originPrice.toLocaleString('en-IN')}</span>
                </div>
              )}
              {protectionPrice !== null && (
                <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border transition-colors ${isProtectionHit ? 'bg-rose-950/30 border-rose-500/40' : 'bg-amber-950/30 border-amber-500/20'}`}>
                  {isProtectionHit ? <Lock size={8} className="text-rose-400" /> : <Shield size={8} className="text-amber-500" />}
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isProtectionHit ? 'text-rose-400' : 'text-amber-500'}`}>PROTECTION-</span>
                  <span className={`text-[10px] font-mono font-black ${isProtectionHit ? 'text-rose-200' : 'text-amber-200'}`}>₹{protectionPrice.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/30 pt-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isProtectionHit ? 'text-rose-500' : isBull ? 'text-emerald-500' : isBear ? 'text-rose-500' : isNeut ? 'text-blue-400' : 'text-slate-500'}`}>
                  {displaySentiment} BIAS
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${isProtectionHit ? 'bg-rose-500 animate-none' : isBull ? 'bg-emerald-500' : isBear ? 'bg-rose-500' : isNeut ? 'bg-blue-500' : 'bg-slate-500'} ${!isProtectionHit ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isProtectionHit ? 'text-rose-400/60' : isBull ? 'text-emerald-400/80' : isBear ? 'text-rose-400/80' : isNeut ? 'text-blue-300/80' : 'text-slate-500'}`}>
              {status}
            </span>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
            {currentPrice !== null && (
              <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border ${isProtectionHit ? 'bg-slate-950 border-slate-800' : 'bg-blue-900/10 border-blue-500/10'}`}>
                <span className={`text-[7px] font-black uppercase tracking-widest ${isProtectionHit ? 'text-slate-500' : 'text-blue-500'}`}>LIVE-</span>
                <span className={`text-[10px] font-mono font-black ${isProtectionHit ? 'text-slate-400' : 'text-white'}`}>₹{currentPrice.toLocaleString('en-IN')}</span>
              </div>
            )}

            {priceDiff !== null && (
              <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border ${
                isPositiveOutcome 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
              }`}>
                <span className="text-[7px] font-black uppercase tracking-widest opacity-60">DIFF-</span>
                <span className="text-[10px] font-mono font-black">
                  {priceDiff >= 0 ? '+' : ''}{priceDiff.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative h-4 bg-slate-950 rounded-full border border-slate-800 p-0.5 flex pointer-events-none">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
            isProtectionHit ? 'bg-slate-800 grayscale' :
            isBull ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-emerald-500/20' : 
            isBear ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-rose-500/20 ml-auto' :
            isNeut ? 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-blue-500/20 mx-auto' :
            'bg-slate-700 w-full'
          }`}
          style={{ width: `${strength}%` }}
        />
        <div className="absolute inset-0 flex justify-between items-center px-3 pointer-events-none">
          <span className="text-[7px] text-white/30 font-black font-mono">0</span>
          <span className="text-[8px] text-white/80 font-black font-mono tracking-tight">{strength}% INTENSITY</span>
          <span className="text-[7px] text-white/30 font-black font-mono">100</span>
        </div>
      </div>
    </div>
  );
};

interface ParticipantLogicRowProps {
  insight: InsightData;
  watchlist?: WatchlistItem[];
  isHighlighted?: boolean;
  onSelect?: () => void;
}

const ParticipantLogicRow: React.FC<ParticipantLogicRowProps> = ({ insight, watchlist = [], isHighlighted, onSelect }) => {
  const { symbol, category, sentiment, viewOrigin, date, protection } = insight;
  const { name } = parseSymbol(symbol);
  const originPrice = viewOrigin || null;
  const normCategory = String(category || '').trim().toUpperCase();
  const isBull = isBullish(sentiment);
  const isBear = isBearish(sentiment);
  const isNeut = isNeutral(sentiment);
  const cleanDate = formatOnlyDate(date);
  const duration = getDurationLabel(category);
  
  const isProtectionHit = checkProtectionHit(insight, watchlist);
  const protectionPrice = protection || null;

  let status = isProtectionHit ? "PROTECTED" : "Balanced";
  let colorTheme = isProtectionHit ? "rose" : "blue";
  let displayCategory = category || 'Terminal';

  if (!isProtectionHit) {
    if (isNeut) {
      status = "Indecision";
      colorTheme = "blue";
      displayCategory = "Range Bound";
    } else if (normCategory === 'SCALP') {
      status = isBear ? "Active Sellers" : isBull ? "Active Buyers" : "Scalping Range";
      colorTheme = isBear ? "rose" : isBull ? "emerald" : "blue";
    } else if (normCategory === 'INTRADAY' || normCategory.includes('SHORT') || normCategory.includes('MEDIUM')) {
      status = isBull ? "Active Buyers" : isBear ? "Active Sellers" : "Sideways Trend";
      colorTheme = isBull ? "emerald" : isBear ? "rose" : "blue";
    } else if (normCategory.includes('LONG')) {
      status = isBull ? "Active Investors" : isBear ? "Active Short-Sellers" : "Hold Zone";
      colorTheme = isBull ? "emerald" : isBear ? "rose" : "blue";
    }
  }

  const textClasses: Record<string, string> = {
    rose: 'text-rose-500',
    emerald: 'text-emerald-500',
    blue: 'text-blue-500'
  };

  return (
    <div 
      id={`participants-${name}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      className={`bg-slate-900 border rounded-2xl p-3 flex items-center justify-between shadow-md transition-all duration-500 cursor-pointer group/card relative overflow-hidden
        ${isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/20 animate-box-glow scale-[1.01] z-10' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'}
        ${isProtectionHit ? 'opacity-30 grayscale-[0.8]' : ''}
      `}
    >
      {isProtectionHit && (
        <div className="absolute inset-0 z-10 bg-rose-500/5 pointer-events-none flex items-center justify-center">
            <span className="status-stamp text-rose-500 text-[10px] scale-[0.7] rotate-[-5deg]">PROTECTED</span>
        </div>
      )}

      <div className="flex items-center space-x-3 pointer-events-none">
        <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-mono font-black border border-slate-700 text-[10px]`}>
          {name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-sm font-black text-white uppercase tracking-tight font-mono leading-none group-hover/card:text-blue-400 transition-colors">
              {name}
            </span>
            {cleanDate && <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{cleanDate}</span>}
          </div>
          {originPrice !== null && (
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest">FROM-</span>
              <span className="text-[9px] font-mono font-bold text-slate-400">₹{originPrice.toLocaleString('en-IN')}</span>
            </div>
          )}
          <span className={`text-[8px] font-black uppercase tracking-widest ${isProtectionHit ? 'text-rose-500' : isBull ? 'text-emerald-500' : isBear ? 'text-rose-500' : 'text-blue-400'}`}>
            {isProtectionHit ? 'PROTECTED' : isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL'} BIAS
          </span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center pointer-events-none px-4">
        <div className={`px-4 py-1 rounded-full border transition-all shadow-inner font-black text-[9px] uppercase tracking-widest ${
          isProtectionHit ? 'bg-rose-950/20 border-rose-500/20 text-rose-500/70' :
          colorTheme === 'rose' ? 'bg-slate-950 border-rose-500/40 text-rose-400' :
          colorTheme === 'emerald' ? 'bg-slate-950 border-emerald-500/40 text-emerald-400' :
          'bg-slate-950 border-blue-500/40 text-blue-400'
        }`}>
          {isProtectionHit ? 'LEVEL EXPIRED' : displayCategory}
        </div>
        {duration && !isProtectionHit && <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter mt-1">{duration}</span>}
        {isProtectionHit && protectionPrice && (
            <span className="text-[7px] font-black text-rose-500/60 uppercase tracking-tighter mt-1 flex items-center">
                <Lock size={8} className="mr-1" /> ₹{protectionPrice.toLocaleString('en-IN')} Triggered
            </span>
        )}
      </div>

      <div className="flex items-center space-x-2 text-right min-w-[100px] pointer-events-none">
        <span className={`text-[9px] font-black uppercase tracking-tighter ${isProtectionHit ? 'text-rose-600' : textClasses[colorTheme]}`}>
          {status}
        </span>
        {isProtectionHit ? <History size={12} className="text-rose-900" /> : <Target size={12} className="text-slate-700 group-hover/card:text-blue-500 transition-colors" />}
      </div>
    </div>
  );
};

interface FlowPatternCardProps {
  insight: InsightData;
  isHighlighted?: boolean;
}

const FlowPatternCard: React.FC<FlowPatternCardProps> = ({ insight, isHighlighted }) => {
  const { symbol, pattern, phase, sentiment, viewOrigin, date } = insight;
  const { name } = parseSymbol(symbol);
  const originPrice = viewOrigin || null;
  const cleanDate = formatOnlyDate(date);
  
  const isAcc = isBullish(phase) || isBullish(pattern);
  const isDis = isBearish(phase) || isBearish(pattern);
  const isNeut = isNeutral(phase) || isNeutral(pattern);
  const isTrendNeut = isNeutral(sentiment);
  const isHFR = isHfr(pattern) || isHfr(phase);

  const displayPattern = isHFR ? 'HIGH FREQUENCY' : (pattern || 'QUANTUM').toUpperCase();
  const subTitle = isTrendNeut ? "Cautious Bias" : isAcc ? "Accumulation" : isDis ? "Distribution" : isNeut ? "Consolidation" : (isHFR ? "HIGH FREQUENCY" : (phase || "Monitoring"));
  const status = isTrendNeut ? "Cautious" : (isAcc || isDis) ? "Active Option Sellers" : (isHFR ? "Active Scalpers" : isNeut ? "Range Bound" : "Scanning Flow");
  const colorTheme = isTrendNeut ? "amber" : isAcc ? "emerald" : isDis ? "rose" : "blue";

  const textClasses: Record<string, string> = {
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500'
  };

  const badgeClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  return (
    <div 
      id={`flow-${name}`}
      className={`bg-slate-900 border rounded-2xl p-4 shadow-xl transition-all duration-500 flex flex-col h-full group 
        ${isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/20 animate-box-glow scale-[1.01] z-10' : 'border-slate-800'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-1.5">
            <h4 className="text-lg font-mono font-black text-white leading-none">
              {name}
            </h4>
            {cleanDate && (
               <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{cleanDate}</span>
               </div>
            )}
          </div>
          {originPrice !== null && (
            <div className="mt-1.5 mb-1 flex items-center space-x-2">
              <span className="text-[6px] font-black text-slate-500 uppercase tracking-[0.2em]">FROM-</span>
              <span className="text-[10px] font-mono font-bold text-slate-400">₹{originPrice.toLocaleString('en-IN')}</span>
            </div>
          )}
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1 block leading-none">{displayPattern} FLOW</span>
        </div>
        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${badgeClasses[colorTheme]}`}>
          {status}
        </span>
      </div>
      
      <div className="flex-1 min-h-[80px] bg-slate-950 rounded-xl border border-slate-800/50 relative overflow-hidden flex flex-col items-center justify-center p-3">
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path 
            d={isHFR 
              ? "M0 30 L10 10 L20 30 L30 10 L40 30 L50 10 L60 30 L70 10 L80 30 L90 10 L100 30" 
              : (isNeut || isTrendNeut) ? "M0 20 Q 25 20, 50 20 T 100 20" : "M0 20 Q 15 15, 30 20 T 60 20 T 90 20 T 100 20"} 
            fill="none" 
            stroke={isTrendNeut ? '#f59e0b' : isAcc ? '#10b981' : isDis ? '#f43f5e' : '#3b82f6'} 
            strokeWidth="1.2"
            className="animate-pulse"
          />
        </svg>
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] relative z-10 animate-pulse ${textClasses[colorTheme]}`}>
          {subTitle}
        </span>
      </div>
    </div>
  );
};

export default MarketInsights;
