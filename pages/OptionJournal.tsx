import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  BookOpen, 
  X, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Clock, 
  LineChart as LineIcon, 
  Percent, 
  FileText,
  RotateCcw,
  RefreshCw,
  Sparkles,
  BookmarkCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { TradeSignal } from '../types';

// Types for Options Journal
export interface MockOptionPosition {
  id: string;
  instrument: string; // NIFTY, BANKNIFTY, FINNIFTY, STOCKS
  strike: number;
  optionType: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  lots: number;
  lotSize: number;
  entryPrice: number; // premium
  cmp: number; // current market price / simulated premium price
  target?: number;
  stopLoss?: number;
  timestamp: string; // entry time iso
  comment?: string;
  
  // Exit statistics
  status: 'OPEN' | 'CLOSED';
  exitPrice?: number;
  exitTimestamp?: string;
  pnl: number;
  
  // Match with sheet signals
  signalId?: string;
}

interface OptionsJournalProps {
  signals?: TradeSignal[];
}

const STORAGE_KEYS = {
  POSITIONS: 'libra_mock_positions',
  INITIAL_CAPITAL: 'libra_mock_capital'
};

const DEFAULT_LOT_SIZES: Record<string, number> = {
  'NIFTY': 50,
  'BANKNIFTY': 15,
  'FINNIFTY': 40,
  'STOCKS (RELIANCE)': 250,
  'STOCKS (TCS)': 175,
};

const OptionsJournal: React.FC<OptionsJournalProps> = ({ signals = [] }) => {
  // Load state from localStorage or defaults
  const [positions, setPositions] = useState<MockOptionPosition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POSITIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved mock positions", e);
      }
    }
    return [];
  });

  const [capital, setCapital] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INITIAL_CAPITAL);
    return saved ? Number(saved) : 500000; // Default ₹5 Lakh capital
  });

  const [restorationCount, setRestorationCount] = useState<number>(() => {
    const saved = localStorage.getItem('libra_mock_restoration_count');
    return saved ? Number(saved) : 0;
  });

  const [showEraseConfirm, setShowEraseConfirm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Brokerage & Regulatory Charges States
  const [brokerageBuy, setBrokerageBuy] = useState<number>(() => {
    const saved = localStorage.getItem('libra_brokerage_buy');
    return saved ? Number(saved) : 20;
  });
  const [brokerageSell, setBrokerageSell] = useState<number>(() => {
    const saved = localStorage.getItem('libra_brokerage_sell');
    return saved ? Number(saved) : 20;
  });
  const [exchangeChargePercent, setExchangeChargePercent] = useState<number>(() => {
    const saved = localStorage.getItem('libra_exchange_charge_percent');
    return saved ? Number(saved) : 0.053; // NSE Options transaction charge
  });

  // Brokerage UI temporary form states
  const [showBrokerageSettings, setShowBrokerageSettings] = useState(false);
  const [tempBuy, setTempBuy] = useState(brokerageBuy.toString());
  const [tempSell, setTempSell] = useState(brokerageSell.toString());
  const [tempEx, setTempEx] = useState(exchangeChargePercent.toString());

  // Active / Simulated premium visual state to indicate tick activity
  const [tickActive, setTickActive] = useState(false);
  const [tickDirection, setTickDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Manual Exit Custom States
  const [showManualExit, setShowManualExit] = useState<Record<string, boolean>>({});
  const [manualExitPrice, setManualExitPrice] = useState<Record<string, string>>({});

  // Sync state to local storage when positions alter
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INITIAL_CAPITAL, capital.toString());
  }, [capital]);

  useEffect(() => {
    localStorage.setItem('libra_brokerage_buy', brokerageBuy.toString());
  }, [brokerageBuy]);

  useEffect(() => {
    localStorage.setItem('libra_brokerage_sell', brokerageSell.toString());
  }, [brokerageSell]);

  useEffect(() => {
    localStorage.setItem('libra_exchange_charge_percent', exchangeChargePercent.toString());
  }, [exchangeChargePercent]);

  // Dynamic Brokerage & regulatory charges calculator helper
  const getTradeCharges = (pos: MockOptionPosition) => {
    const qty = pos.lots * pos.lotSize;
    const currentPrice = pos.status === 'CLOSED' ? (pos.exitPrice ?? pos.cmp) : pos.cmp;
    
    // Leg 1 (Entry) Charges
    const entryBrokerage = pos.action === 'BUY' ? brokerageBuy : brokerageSell;
    const entryExchange = pos.entryPrice * qty * (exchangeChargePercent / 100);
    const entryCharges = entryBrokerage + entryExchange;

    let exitBrokerage = 0;
    let exitExchange = 0;
    let exitCharges = 0;
    if (pos.status === 'CLOSED') {
      // Leg 2 (Exit) Charges
      exitBrokerage = pos.action === 'BUY' ? brokerageSell : brokerageBuy;
      exitExchange = currentPrice * qty * (exchangeChargePercent / 100);
      exitCharges = exitBrokerage + exitExchange;
    }

    const totalCharges = Math.round((entryCharges + exitCharges) * 100) / 100;
    const grossPnl = Math.round((pos.action === 'BUY' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice)) * qty * 100) / 100;

    // Explicitly handle profit and loss outcomes safely to guarantee that:
    // 1. If trade is in profit (grossPnl > 0), charges will reduce the net profit: profit reduces.
    // 2. If trade is in loss (grossPnl <= 0), charges will increase the net loss (making net P&L more negative/worse).
    // Mathematically, (grossPnl - totalCharges) handles both:
    // e.g. Gross Profit of ₹500 - ₹20 charges = ₹480 Net Profit.
    // e.g. Gross Loss of -₹500 - ₹20 charges = -₹520 Net Loss.
    const netPnl = Math.round((grossPnl - totalCharges) * 100) / 100;

    return {
      grossPnl,
      totalCharges,
      netPnl,
      entryBrokerage,
      entryExchange,
      exitBrokerage,
      exitExchange
    };
  };

  // Real-Time Sync loop to lock onto Sheets CMP feed
  useEffect(() => {
    if (!signals || signals.length === 0) return;

    setPositions(prev => {
      let changed = false;
      const updated = prev.map(pos => {
        if (pos.status === 'CLOSED') return pos;

        // Try to find matching sheet signal
        let matchingSig = signals.find(s => s.id === pos.signalId);

        if (!matchingSig) {
          // Fallback matching by Instrument + Strike + Type + Action
          matchingSig = signals.find(s => {
            const rawInst = (s.instrument || '').trim().toUpperCase();
            let compInstrument = 'NIFTY';
            if (rawInst.includes('BANKNIFTY') || rawInst.includes('BANK NIFTY')) {
              compInstrument = 'BANKNIFTY';
            } else if (rawInst.includes('FINNIFTY') || rawInst.includes('FIN NIFTY')) {
              compInstrument = 'FINNIFTY';
            } else if (rawInst.includes('RELIANCE')) {
              compInstrument = 'STOCKS (RELIANCE)';
            } else if (rawInst.includes('TCS')) {
              compInstrument = 'STOCKS (TCS)';
            } else {
              compInstrument = rawInst || 'NIFTY';
            }

            const optType = s.type === 'CE' ? 'CE' : 'PE';
            const actionType = s.action === 'BUY' ? 'BUY' : 'SELL';

            const strikeMatch = (s.symbol || '').match(/\b\d{4,5}\b/) || (s.instrument || '').match(/\b\d{4,5}\b/);
            const compStrike = strikeMatch ? Number(strikeMatch[0]) : 23000;

            return compInstrument === pos.instrument &&
                   compStrike === pos.strike &&
                   optType === pos.optionType &&
                   actionType === pos.action;
          });
        }

        if (matchingSig) {
          const isSLHit = matchingSig.status === 'STOP LOSS HIT';
          const isAllTarget = matchingSig.status === 'ALL TARGET DONE';
          const isExited = matchingSig.status === 'EXITED' || isSLHit || isAllTarget;
          
          let newCmp = isNaN(Number(matchingSig.cmp)) || matchingSig.cmp === undefined || matchingSig.cmp === null 
            ? Number(matchingSig.entryPrice || 0) 
            : Number(matchingSig.cmp);
          
          if (isSLHit) {
            newCmp = Number(matchingSig.stopLoss || 0);
          } else if (isAllTarget && matchingSig.targets && matchingSig.targets.length > 0) {
            newCmp = Number(matchingSig.targets[matchingSig.targets.length - 1]);
          }

          if (newCmp < 0.05) newCmp = 0.05;
          newCmp = Math.round(newCmp * 100) / 100;

          let finalStatus = pos.status;
          let finalPrice = pos.exitPrice;
          let finalTime = pos.exitTimestamp;

          // Check custom Targets/Stop Loss on the Sandbox position itself
          const isTargetReached = pos.target && (pos.action === 'BUY' ? newCmp >= pos.target : newCmp <= pos.target);
          const isSLReached = pos.stopLoss && (pos.action === 'BUY' ? newCmp <= pos.stopLoss : newCmp >= pos.stopLoss);

          if (isTargetReached) {
            newCmp = pos.target!;
            finalStatus = 'CLOSED';
            finalPrice = pos.target;
            finalTime = new Date().toISOString();
            changed = true;
          } else if (isSLReached) {
            newCmp = pos.stopLoss!;
            finalStatus = 'CLOSED';
            finalPrice = pos.stopLoss;
            finalTime = new Date().toISOString();
            changed = true;
          } else if (isExited) {
            // Auto close if parent contract exited
            finalStatus = 'CLOSED';
            finalPrice = newCmp;
            finalTime = new Date().toISOString();
            changed = true;
          } else if (newCmp !== pos.cmp) {
            changed = true;
          }

          // Recalculate PnL
          const qty = pos.lots * pos.lotSize;
          const currentPrice = finalStatus === 'CLOSED' ? (finalPrice ?? newCmp) : newCmp;
          const pnlPoints = pos.action === 'BUY' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
          const pnl = Math.round(pnlPoints * qty * 100) / 100;

          return {
            ...pos,
            cmp: newCmp,
            status: finalStatus,
            exitPrice: finalPrice,
            exitTimestamp: finalTime,
            pnl,
            signalId: pos.signalId || matchingSig.id
          };
        }

        return pos;
      });

      if (changed) {
        setTickActive(true);
        const draw = Math.random();
        setTickDirection(draw > 0.6 ? 'up' : draw < 0.4 ? 'down' : 'neutral');
        setTimeout(() => setTickActive(false), 800);
        return updated;
      }

      return prev;
    });
  }, [signals]);

  const handleRestoreCapital = () => {
    setCapital(500000);
    setRestorationCount(prev => {
      const next = prev + 1;
      localStorage.setItem('libra_mock_restoration_count', next.toString());
      return next;
    });
  };

  const handleSquareOffPosition = (id: string, customExitPrice?: number) => {
    setPositions(prev => prev.map(pos => {
      if (pos.id !== id || pos.status === 'CLOSED') return pos;

      const finalExitPrice = customExitPrice !== undefined ? customExitPrice : pos.cmp;
      const qty = pos.lots * pos.lotSize;
      const pnlPoints = pos.action === 'BUY' ? (finalExitPrice - pos.entryPrice) : (pos.entryPrice - finalExitPrice);
      const finalPnl = Math.round(pnlPoints * qty * 100) / 100;

      return {
        ...pos,
        cmp: finalExitPrice,
        status: 'CLOSED',
        exitPrice: finalExitPrice,
        exitTimestamp: new Date().toISOString(),
        pnl: finalPnl
      };
    }));
  };

  const handleDeletePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  const handleResetJournal = () => {
    setPositions([]);
    setCapital(500000);
    setRestorationCount(0);
    localStorage.removeItem(STORAGE_KEYS.POSITIONS);
    localStorage.removeItem(STORAGE_KEYS.INITIAL_CAPITAL);
    localStorage.removeItem('libra_mock_restoration_count');
    setShowEraseConfirm(false);
  };

  // Helper formats
  const formatRupees = (amount: number) => {
    const isNegative = amount < 0;
    const abs = Math.abs(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0
    });
    return `${isNegative ? '-' : ''}₹${abs}`;
  };

  const timeDiffString = (startIso: string, endIso: string) => {
    const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`;
    
    const diffHrs = Math.floor(diffMins / 60);
    return `${diffHrs}h ${diffMins % 60}m`;
  };

  // Compute stats metrics
  const activePositions = useMemo(() => positions.filter(p => p.status === 'OPEN'), [positions]);
  const closedPositions = useMemo(() => positions.filter(p => p.status === 'CLOSED'), [positions]);

  const stats = useMemo(() => {
    const totalTrades = closedPositions.length;
    
    const closedWithNet = closedPositions.map(p => {
      const { netPnl } = getTradeCharges(p);
      return { ...p, netPnl };
    });
    const activeWithNet = activePositions.map(p => {
      const { netPnl } = getTradeCharges(p);
      return { ...p, netPnl };
    });

    const wins = closedWithNet.filter(p => p.netPnl > 0);
    const losses = closedWithNet.filter(p => p.netPnl <= 0);
    const winRate = totalTrades === 0 ? 0 : (wins.length / totalTrades) * 100;

    const totalRealizedPnl = closedWithNet.reduce((sum, p) => sum + p.netPnl, 0);
    const runningActivePnl = activeWithNet.reduce((sum, p) => sum + p.netPnl, 0);

    // StdDev of Wins
    let stdDevWins = 0;
    if (wins.length > 1) {
      const avgWin = wins.reduce((sum, p) => sum + p.netPnl, 0) / wins.length;
      const sqDiffSum = wins.reduce((sum, p) => sum + Math.pow(p.netPnl - avgWin, 2), 0);
      stdDevWins = Math.round(Math.sqrt(sqDiffSum / wins.length));
    }

    // Average Hold Time (closed trades)
    let avgHoldTimeSeconds = 0;
    if (totalTrades > 0) {
      const totalHoldMs = closedPositions.reduce((sum, p) => {
        if (!p.exitTimestamp) return sum;
        return sum + (new Date(p.exitTimestamp).getTime() - new Date(p.timestamp).getTime());
      }, 0);
      avgHoldTimeSeconds = Math.floor((totalHoldMs / totalTrades) / 1000);
    }

    const formatSeconds = (totalSecs: number) => {
      if (totalSecs === 0) return 'N/A';
      if (totalSecs < 60) return `${totalSecs}s`;
      const mins = Math.floor(totalSecs / 60);
      if (mins < 60) return `${mins}m ${totalSecs % 60}s`;
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    return {
      totalRealizedPnl,
      runningActivePnl,
      winRate,
      winsCount: wins.length,
      lossesCount: losses.length,
      stdDevWins,
      avgHoldTime: formatSeconds(avgHoldTimeSeconds),
      totalTrades
    };
  }, [closedPositions, activePositions, brokerageBuy, brokerageSell, exchangeChargePercent]);

  // Recharts Data preparation
  const chartData = useMemo(() => {
    // Cumulative equity plot
    // Sort closed positions chronologically
    const sorted = [...closedPositions].sort(
      (a, b) => new Date(a.exitTimestamp || a.timestamp).getTime() - new Date(b.exitTimestamp || b.timestamp).getTime()
    );

    let currentEquity = capital;
    const data = [{
      name: 'Start',
      pnl: 0,
      equity: capital,
    }];

    sorted.forEach((trade, index) => {
      const { netPnl } = getTradeCharges(trade);
      currentEquity += netPnl;
      data.push({
        name: `Trade ${index + 1}`,
        pnl: netPnl,
        equity: currentEquity,
      });
    });

    return data;
  }, [closedPositions, capital, brokerageBuy, brokerageSell, exchangeChargePercent]);

  // Win loss distributions bar chart
  const distributionData = useMemo(() => {
    return [
      { name: 'Wins', count: stats.winsCount, fill: '#10b981' },
      { name: 'Losses', count: stats.lossesCount, fill: '#f43f5e' }
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center">
            <Briefcase size={24} className="mr-2 text-blue-500 animate-pulse" />
            Options Sandbox & Journal
          </h2>
          <p className="text-slate-400 text-sm font-mono tracking-tighter italic">Simulated Risk-Testing & Option Position Journal</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
          {/* Capital restoration */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs">
              <span className="text-slate-500">Practice Capital:</span>
              <span className="text-white font-heavy">{formatRupees(capital)}</span>
              {restorationCount > 0 && (
                <span className="text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold" title={`${restorationCount} restoration(s) made`}>
                  {restorationCount} Restored
                </span>
              )}
            </div>
            <button
              onClick={handleRestoreCapital}
              className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 hover:text-blue-300 border border-blue-900/40 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center justify-center"
              title="Restore practice capital back to default ₹5,00,000"
            >
              <RotateCcw size={11} className="mr-1" /> Restore
            </button>
          </div>

          {/* Brokerage & Charges Settings Toggle Button */}
          <button
            onClick={() => {
              setTempBuy(brokerageBuy.toString());
              setTempSell(brokerageSell.toString());
              setTempEx(exchangeChargePercent.toString());
              setShowBrokerageSettings(!showBrokerageSettings);
            }}
            className={`flex items-center px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
              showBrokerageSettings 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <Percent size={12} className="mr-1.5" /> Brokerage & Charges
          </button>

          {showEraseConfirm ? (
            <div className="flex items-center bg-rose-950/20 border border-rose-900/40 p-1 px-2 rounded-xl animate-in zoom-in-95 duration-150">
              <span className="text-[9px] text-rose-400 font-bold uppercase tracking-tight mr-2 pl-1">Erase ALL history?</span>
              <button 
                onClick={handleResetJournal} 
                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider animate-pulse"
              >
                Yes, Erase
              </button>
              <button 
                onClick={() => setShowEraseConfirm(false)} 
                className="ml-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-all text-[9px] font-black uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowEraseConfirm(true)} 
              className="flex items-center px-3 py-1.5 bg-slate-900/50 hover:bg-rose-950/30 text-rose-500 hover:text-rose-400 border border-slate-800 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
            >
              <RotateCcw size={12} className="mr-1.5" /> Erase Journal
            </button>
          )}
        </div>
      </div>

      {/* Brokerage Settings Configurator Form */}
      {showBrokerageSettings && (
        <div className="bg-slate-900 rounded-2xl border border-amber-500/20 p-5 mt-2 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/60">
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Percent size={14} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-tight">Modify Brokerage & Exchange Fees</h4>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-1">Charges are dynamically calculated & deducted from net trade premium returns</p>
              </div>
            </div>
            <button 
              onClick={() => setShowBrokerageSettings(false)} 
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Buy Order Brokerage (₹)</label>
              <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden pr-2">
                <span className="pl-3 text-slate-500 font-mono text-xs">₹</span>
                <input
                  type="number"
                  step="1"
                  value={tempBuy}
                  onChange={(e) => setTempBuy(e.target.value)}
                  className="w-full bg-transparent text-white text-xs p-3 focus:outline-none font-mono font-bold"
                  placeholder="20"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sell Order Brokerage (₹)</label>
              <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden pr-2">
                <span className="pl-3 text-slate-500 font-mono text-xs">₹</span>
                <input
                  type="number"
                  step="1"
                  value={tempSell}
                  onChange={(e) => setTempSell(e.target.value)}
                  className="w-full bg-transparent text-white text-xs p-3 focus:outline-none font-mono font-bold"
                  placeholder="20"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Exchange Transaction Fee (%)</label>
              <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden pr-3 font-mono">
                <input
                  type="number"
                  step="0.001"
                  value={tempEx}
                  onChange={(e) => setTempEx(e.target.value)}
                  className="w-full bg-transparent text-white text-xs p-3 focus:outline-none font-bold"
                  placeholder="0.053"
                />
                <span className="text-slate-500 text-xs font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-slate-800/60">
            <button
              onClick={() => {
                setBrokerageBuy(20);
                setBrokerageSell(20);
                setExchangeChargePercent(0.053);
                setTempBuy("20");
                setTempSell("20");
                setTempEx("0.053");
                localStorage.setItem('libra_brokerage_buy', '20');
                localStorage.setItem('libra_brokerage_sell', '20');
                localStorage.setItem('libra_exchange_charge_percent', '0.053');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reset to Defaults
            </button>
            <button
              onClick={() => {
                const bBuy = parseFloat(tempBuy);
                const bSell = parseFloat(tempSell);
                const ePercent = parseFloat(tempEx);
                if (!isNaN(bBuy) && bBuy >= 0) setBrokerageBuy(bBuy);
                if (!isNaN(bSell) && bSell >= 0) setBrokerageSell(bSell);
                if (!isNaN(ePercent) && ePercent >= 0) setExchangeChargePercent(ePercent);
                setShowBrokerageSettings(false);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              Apply Charges config
            </button>
          </div>
        </div>
      )}

      {/* Analytical Quick Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Realized PnL */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700/50 transition-all shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Realized PnL</p>
          <div className="mt-2">
            <h3 className={`text-xl font-black font-mono tracking-tight ${stats.totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatRupees(stats.totalRealizedPnl)}
            </h3>
            <span className="text-[8px] text-slate-500 block font-bold mt-1 uppercase">Inclusive of charges</span>
          </div>
        </div>

        {/* Live Active PnL */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 shadow-lg ${tickActive ? 'bg-slate-900 ring-2 ring-blue-500/30' : 'bg-slate-900'} border-slate-800`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Simulated Open PnL</p>
            <div className={`w-2 h-2 rounded-full ${activePositions.length > 0 ? 'bg-blue-500 animate-ping' : 'bg-slate-700'}`}></div>
          </div>
          <div className="mt-2">
            <h3 className={`text-xl font-black font-mono tracking-tight ${stats.runningActivePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatRupees(stats.runningActivePnl)}
            </h3>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="text-[8px] text-slate-400 font-mono tracking-tighter uppercase">{activePositions.length} Positions</span>
              {tickActive && (
                <span className={`text-[7px] font-mono ${tickDirection === 'up' ? 'text-emerald-500' : tickDirection === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                  {tickDirection === 'up' ? '▲ LIVE TICK' : tickDirection === 'down' ? '▼ LIVE TICK' : '■ TICK'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700/50 transition-all shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sandbox Win Rate</p>
          <div className="mt-2">
            <h3 className={`text-2xl font-black font-mono tracking-tight text-white`}>
              {stats.winRate.toFixed(1)}%
            </h3>
            <span className="text-[8px] text-slate-500 block font-bold mt-1 uppercase">{stats.winsCount} Wins / {stats.lossesCount} Losses</span>
          </div>
        </div>

        {/* StdDev of Wins */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700/50 transition-all shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Std. Dev. of Wins</p>
          <div className="mt-2">
            <h3 className={`text-xl font-black font-mono tracking-tight text-yellow-500`}>
              {stats.stdDevWins ? formatRupees(stats.stdDevWins) : '₹0'}
            </h3>
            <span className="text-[8px] text-slate-500 block font-bold mt-1 uppercase">Volatility of winning trades</span>
          </div>
        </div>

        {/* Average Hold Time */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700/50 transition-all shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Average Hold Time</p>
          <div className="mt-2">
            <h3 className={`text-lg font-black font-mono tracking-tight text-white truncate`}>
              {stats.avgHoldTime}
            </h3>
            <span className="text-[8px] text-slate-500 block font-bold mt-1 uppercase">Entry to Square-off duration</span>
          </div>
        </div>

        {/* Account Ending Balance */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700/50 transition-all shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Simulated Equity</p>
          <div className="mt-2">
            <h3 className={`text-xl font-black font-mono tracking-tight text-white`}>
              {formatRupees(capital + stats.totalRealizedPnl + stats.runningActivePnl)}
            </h3>
            <span className="text-[8px] text-slate-500 block font-bold mt-1 uppercase">Practice account valuation</span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Positions Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Arena Block */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/60 font-medium">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Activity size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Active Paper Positions</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Simulating live sheets-linked derivative feedback loop</p>
                </div>
              </div>

              {activePositions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest">Feed Syncing</span>
                </div>
              )}
            </div>

            {activePositions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-600 mb-4 animate-bounce">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Simulator Clean</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                  You have no active simulated options trades. Trigger "Paper Trade" on any active contract card in the main dashboard to deploy.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto no-scrollbar pr-1">
                {activePositions.map(pos => {
                  const qty = pos.lots * pos.lotSize;
                  const percentGain = ((pos.cmp - pos.entryPrice) / pos.entryPrice) * 100 * (pos.action === 'BUY' ? 1 : -1);

                  return (
                    <div 
                      key={pos.id} 
                      id={`mock-${pos.id}`}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Position meta */}
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${pos.action === 'BUY' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'}`}>
                              {pos.action}
                            </span>
                            <span className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                              {pos.lots} lots ({qty} qty)
                            </span>
                            <span className="text-xs font-black text-white uppercase tracking-tight">
                              {pos.instrument} {pos.strike} {pos.optionType}
                            </span>
                            <span className="text-[7px] font-mono text-slate-600">ID: {pos.id}</span>
                          </div>

                          <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-400 font-medium">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span className="text-slate-500 font-mono text-[8px] bg-slate-900 px-1 py-0.5 rounded">
                                Size: {pos.lotSize}/lot
                              </span>
                              <Clock size={11} className="text-slate-600" />
                              <span>{new Date(pos.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                            {pos.comment && <div className="text-slate-500 truncate max-w-[150px] md:max-w-[250px]" title={pos.comment}>"{pos.comment}"</div>}
                          </div>
                        </div>

                        {/* CMP Premium metrics */}
                        <div className="grid grid-cols-3 gap-4 text-center md:text-right md:justify-items-end flex-1 max-w-sm">
                          <div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Entry</span>
                            <span className="font-mono text-xs font-bold text-slate-300">₹{pos.entryPrice}</span>
                          </div>

                          <div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Sheet CMP</span>
                            <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded ${tickActive ? 'bg-blue-900/35 text-white animate-pulse' : 'text-blue-400'}`}>
                              ₹{pos.cmp}
                            </span>
                          </div>

                          <div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Sim. Targets</span>
                            <div className="text-[9px] text-slate-400 font-semibold font-mono space-y-0.5">
                              <div>T: <span className="text-emerald-400">{pos.target ? `₹${pos.target}` : 'N/A'}</span></div>
                              <div>S: <span className="text-rose-400">{pos.stopLoss ? `₹${pos.stopLoss}` : 'N/A'}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Square-off panel */}
                        <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                          <div className="text-left md:text-right">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-0.5">Net P&L</span>
                            {(() => {
                              const { grossPnl, totalCharges, netPnl } = getTradeCharges(pos);
                              const entryValue = pos.entryPrice * qty;
                              const netPercent = entryValue > 0 ? (netPnl / entryValue) * 100 : percentGain;
                              return (
                                <>
                                  <span className={`text-sm font-black font-mono block ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {netPnl >= 0 ? '+' : ''}{formatRupees(netPnl)}
                                  </span>
                                  <span className={`text-[9px] font-mono font-bold block ${netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {netPnl >= 0 ? '+' : ''}{netPercent.toFixed(2)}%
                                  </span>
                                  <div className="text-[9px] font-mono text-slate-500 mt-1 space-y-1 whitespace-nowrap">
                                    <span title="Gross return before brokerage and regulatory charges">G: <span className={grossPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{formatRupees(grossPnl)}</span></span>
                                    <span>•</span>
                                    <span title="Deductions: Order Brokerage + Est. Transaction exchange charge">Charges: <span className="text-amber-500">₹{totalCharges?.toFixed(1)}</span></span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {showManualExit[pos.id] ? (
                            <div className="flex flex-col space-y-1.5 p-2 bg-slate-900 border border-emerald-500/40 rounded-xl text-[10px] w-48 animate-in fade-in zoom-in-95">
                              <span className="text-emerald-400 font-black uppercase tracking-widest text-[8px] block">Manual Exit Price</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-slate-500 font-mono">₹</span>
                                <input
                                  type="number"
                                  step="0.05"
                                  value={manualExitPrice[pos.id] ?? pos.cmp.toString()}
                                  onChange={(e) => setManualExitPrice(prev => ({ ...prev, [pos.id]: e.target.value }))}
                                  className="w-16 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold rounded-lg border border-slate-800 px-1 py-0.5 text-center text-xs focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  onClick={() => {
                                    const parsedVal = Number(manualExitPrice[pos.id] ?? pos.cmp);
                                    if (!isNaN(parsedVal) && parsedVal >= 0) {
                                      handleSquareOffPosition(pos.id, parsedVal);
                                      setShowManualExit(prev => ({ ...prev, [pos.id]: false }));
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Exit
                                </button>
                                <button
                                  onClick={() => setShowManualExit(prev => ({ ...prev, [pos.id]: false }))}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setManualExitPrice(prev => ({ ...prev, [pos.id]: pos.cmp.toString() }));
                                setShowManualExit(prev => ({ ...prev, [pos.id]: true }));
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center shadow-md shadow-emerald-900/20 cursor-pointer"
                            >
                              <CheckCircle size={10} className="mr-1" /> Close Mock
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Historical Charts Block */}
        <div className="lg:col-span-1 space-y-6">
          {closedPositions.length > 0 ? (
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-800/60">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <LineIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Performance Charts</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Equity curve tracking simulated wins/losses</p>
                  </div>
                </div>

                {/* Visual Equity Curve */}
                <div className="h-[180px] mb-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Simulated Equity</p>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={chartData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#475569" 
                        fontSize={9} 
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={9} 
                        tickLine={false} 
                        tickFormatter={(v) => `₹${(v / 1000)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '10px' }}
                        itemStyle={{ fontWeight: 'black', fontSize: '11px' }}
                        formatter={(value: any) => [formatRupees(Number(value)), 'Valuation']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="equity" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ r: 3, stroke: '#3b82f6', fill: '#0f172a' }}
                        activeDot={{ r: 5 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Win Rate Bar Chart */}
              <div className="h-[180px] flex flex-col justify-between border-t border-slate-800/60 pt-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trade Statistics Ratio</p>
                <div className="flex-1 min-h-[100px] pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '11px' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[9px] font-bold text-slate-400 text-center uppercase mt-1">
                  Win: <span className="text-emerald-400">{stats.winsCount} ({stats.winRate.toFixed(0)}%)</span> | Loss: <span className="text-rose-500">{stats.lossesCount} ({(100 - stats.winRate).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl text-center h-full flex flex-col justify-center py-16">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-600 mb-4 inline-block mx-auto">
                <LineIcon size={24} />
              </div>
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">No Analytical Data</h4>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-2">
                Practise options lot deployments by paper-trading signals and closing them to generate visual performance matrices and stats.
              </p>
            </div>
          )}
        </div>
        
      </div>

      {/* Complete Historical Option Position Journal Log */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-800/60 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Paper Options Journal & Trades log</h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Repository of executed options practice contracts</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Total Closed Contracts</span>
            <span className="text-xs font-black text-white font-mono uppercase">{closedPositions.length} Trades logged</span>
          </div>
        </div>

        {closedPositions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-600 mb-4">
              <FileText size={24} />
            </div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">No Closed Trades Logged Yet</h4>
            <p className="text-[10px] text-slate-500 max-w-sm mt-1">
              Your closed sandbox positions will appear here with final profit/loss results, standard deviations, and duration insights.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-500 text-[9px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Trade Contract Info</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size (Qty)</th>
                  <th className="py-3 px-4">Premium Entry</th>
                  <th className="py-3 px-4">Premium Exit</th>
                  <th className="py-3 px-4">Sim. Duration</th>
                  <th className="py-3 px-4">Realized P&L</th>
                  <th className="py-3 px-4 text-right">Clear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {closedPositions.map(pos => {
                  const duration = pos.exitTimestamp ? timeDiffString(pos.timestamp, pos.exitTimestamp) : 'N/A';

                  return (
                    <tr key={pos.id} className="hover:bg-slate-950/40 transition-colors text-slate-300 text-xs font-medium">
                      <td className="py-3.5 px-4 font-heavy text-white">
                        <div className="flex flex-col">
                          <span className="font-bold">{pos.instrument} {pos.strike} {pos.optionType}</span>
                          <span className="text-[8px] text-slate-500 font-medium font-mono uppercase mt-0.5">
                            Entered {new Date(pos.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(pos.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${pos.action === 'BUY' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20' : 'bg-amber-600/15 text-amber-400 border border-amber-500/20'}`}>
                          {pos.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {pos.lots} lots ({pos.lots * pos.lotSize} qty)
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">₹{pos.entryPrice}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">₹{pos.exitPrice || pos.cmp}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <Clock size={11} className="text-slate-600" />
                          <span className="font-mono text-[11px]">{duration}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const { grossPnl, totalCharges, netPnl } = getTradeCharges(pos);
                          const isNetProfit = netPnl > 0;
                          return (
                            <div className="flex flex-col">
                              <span className={`font-mono font-black ${isNetProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isNetProfit ? '+' : ''}{formatRupees(netPnl)}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 mt-1 space-x-1 whitespace-nowrap">
                                <span title="Gross returns before brokerage/charges">G: <span className={grossPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{formatRupees(grossPnl)}</span></span>
                                <span>•</span>
                                <span title="Simulated brokerage & exchange transaction charges">C: <span className="text-amber-500">₹{totalCharges.toFixed(1)}</span></span>
                              </span>
                              {pos.comment && (
                                <span className="text-[10px] text-slate-500 italic mt-1 truncate max-w-[150px]" title={pos.comment}>
                                  "{pos.comment}"
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {confirmDeleteId === pos.id ? (
                          <div className="flex items-center space-x-1 justify-end animate-in fade-in zoom-in-95 duration-150">
                            <button
                              onClick={() => {
                                handleDeletePosition(pos.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[9px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-1.5 py-1 rounded uppercase transition-all"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-1.5 py-1 rounded uppercase transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(pos.id)}
                            className="p-1 px-1.5 hover:bg-rose-950/40 text-slate-600 hover:text-rose-500 rounded-lg transition-colors"
                            title="Delete trade"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default OptionsJournal;
