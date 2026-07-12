import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, BookOpen, X, 
  CheckCircle, AlertTriangle, Activity, Clock, LineChart as LineIcon, 
  Percent, FileText, RotateCcw, Sparkles, Coins, PlusCircle, 
  ArrowUpRight, ArrowDownRight, Edit2, Calendar, Filter, HelpCircle, Save, Info, BookMarked
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { User } from '../types';

// Types for Personal Journal
export interface PersonalOptionTrade {
  id: string;
  date: string; // YYYY-MM-DD
  instrument: string; // NIFTY, BANKNIFTY, custom etc.
  strike: number;
  optionType: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  status: 'OPEN' | 'CLOSED';
  stopLoss?: number;
  target?: number;
  charges: number; // brokerage + other taxes
  pnl: number; // calculated pnl
  comments?: string;
}

export interface PersonalInvestment {
  id: string;
  symbol: string;
  category: 'EQUITY' | 'MUTUAL_FUND' | 'GOLD' | 'DEBT' | 'CRYPTO' | 'OTHER';
  quantity: number;
  buyPrice: number;
  buyDate: string; // YYYY-MM-DD
  currentPrice: number;
  status: 'HOLDING' | 'EXITED';
  sellPrice?: number;
  sellDate?: string; // YYYY-MM-DD
  comments?: string;
}

interface PersonalJournalProps {
  user: User | null;
}

const PERSONAL_STORAGE_KEYS = {
  OPTIONS: 'libra_personal_option_trades',
  PORTFOLIO: 'libra_personal_portfolio',
  SETTINGS: 'libra_personal_journal_settings'
};

const CATEGORIES = [
  { value: 'EQUITY', label: 'Equity / Stocks', color: '#3b82f6' },
  { value: 'MUTUAL_FUND', label: 'Mutual Funds', color: '#10b981' },
  { value: 'GOLD', label: 'Gold / Commodities', color: '#eab308' },
  { value: 'DEBT', label: 'Debt / Bonds', color: '#8b5cf6' },
  { value: 'CRYPTO', label: 'Crypto', color: '#f97316' },
  { value: 'OTHER', label: 'Other Investments', color: '#64748b' }
];

const PersonalJournal: React.FC<PersonalJournalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'options' | 'portfolio' | 'insights'>('options');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Core States
  const [optionTrades, setOptionTrades] = useState<PersonalOptionTrade[]>(() => {
    const saved = localStorage.getItem(PERSONAL_STORAGE_KEYS.OPTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [portfolio, setPortfolio] = useState<PersonalInvestment[]>(() => {
    const saved = localStorage.getItem(PERSONAL_STORAGE_KEYS.PORTFOLIO);
    return saved ? JSON.parse(saved) : [];
  });

  // Settings
  const [defaultChargesPerTrade, setDefaultChargesPerTrade] = useState<number>(() => {
    const saved = localStorage.getItem(PERSONAL_STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.defaultCharges ?? 40;
      } catch (e) {
        return 40;
      }
    }
    return 40;
  });

  // Forms Visibility
  const [showAddOption, setShowAddOption] = useState(false);
  const [showAddInv, setShowAddInv] = useState(false);

  // Forms values - Options
  const [optDate, setOptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [optInstrument, setOptInstrument] = useState('NIFTY');
  const [optStrike, setOptStrike] = useState('');
  const [optType, setOptType] = useState<'CE' | 'PE'>('CE');
  const [optAction, setOptAction] = useState<'BUY' | 'SELL'>('BUY');
  const [optQty, setOptQty] = useState('');
  const [optEntryPrice, setOptEntryPrice] = useState('');
  const [optExitPrice, setOptExitPrice] = useState('');
  const [optStatus, setOptStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
  const [optStopLoss, setOptStopLoss] = useState('');
  const [optTarget, setOptTarget] = useState('');
  const [optCharges, setOptCharges] = useState('40');
  const [optComments, setOptComments] = useState('');

  // Forms values - Investments
  const [invSymbol, setInvSymbol] = useState('');
  const [invCategory, setInvCategory] = useState<PersonalInvestment['category']>('EQUITY');
  const [invQty, setInvQty] = useState('');
  const [invBuyPrice, setInvBuyPrice] = useState('');
  const [invBuyDate, setInvBuyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invCurrentPrice, setInvCurrentPrice] = useState('');
  const [invComments, setInvComments] = useState('');

  // Editing CMP or exiting investments
  const [editingCmpId, setEditingCmpId] = useState<string | null>(null);
  const [editingCmpVal, setEditingCmpVal] = useState('');
  const [exitingInvId, setExitingInvId] = useState<string | null>(null);
  const [exitPriceVal, setExitPriceVal] = useState('');
  const [exitDateVal, setExitDateVal] = useState(() => new Date().toISOString().slice(0, 10));

  // Edit trade inline option
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [tradeExitPriceVal, setTradeExitPriceVal] = useState('');

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(PERSONAL_STORAGE_KEYS.OPTIONS, JSON.stringify(optionTrades));
  }, [optionTrades]);

  useEffect(() => {
    localStorage.setItem(PERSONAL_STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem(PERSONAL_STORAGE_KEYS.SETTINGS, JSON.stringify({ defaultCharges: defaultChargesPerTrade }));
  }, [defaultChargesPerTrade]);

  // Handle addition of options trades
  const handleAddOptionTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const strikeNum = Number(optStrike);
    const qtyNum = Number(optQty);
    const entryPriceNum = Number(optEntryPrice);
    const exitPriceNum = optExitPrice ? Number(optExitPrice) : undefined;
    const slNum = optStopLoss ? Number(optStopLoss) : undefined;
    const tgtNum = optTarget ? Number(optTarget) : undefined;
    const chargesNum = Number(optCharges) || 0;

    if (!optInstrument.trim() || isNaN(strikeNum) || isNaN(qtyNum) || isNaN(entryPriceNum) || strikeNum <= 0 || qtyNum <= 0 || entryPriceNum <= 0) {
      alert("Please fill all trade details with positive numbers.");
      return;
    }

    let tradePnl = 0;
    if (optStatus === 'CLOSED' && exitPriceNum !== undefined) {
      const gross = optAction === 'BUY' 
        ? (exitPriceNum - entryPriceNum) * qtyNum 
        : (entryPriceNum - exitPriceNum) * qtyNum;
      tradePnl = gross - chargesNum;
    }

    const newTrade: PersonalOptionTrade = {
      id: 'p-opt-' + Date.now().toString(36),
      date: optDate,
      instrument: optInstrument.toUpperCase().trim(),
      strike: strikeNum,
      optionType: optType,
      action: optAction,
      quantity: qtyNum,
      entryPrice: entryPriceNum,
      exitPrice: optStatus === 'CLOSED' ? exitPriceNum : undefined,
      status: optStatus,
      stopLoss: slNum,
      target: tgtNum,
      charges: chargesNum,
      pnl: Math.round(tradePnl * 100) / 100,
      comments: optComments
    };

    setOptionTrades(prev => [newTrade, ...prev]);
    setShowAddOption(false);
    
    // reset form
    setOptStrike('');
    setOptQty('');
    setOptEntryPrice('');
    setOptExitPrice('');
    setOptStopLoss('');
    setOptTarget('');
    setOptComments('');
    setOptStatus('CLOSED');
  };

  // Close open trade manually
  const handleCloseOptionTrade = (id: string, exitPrice: number) => {
    setOptionTrades(prev => prev.map(t => {
      if (t.id !== id) return t;
      const charges = t.charges || defaultChargesPerTrade;
      const gross = t.action === 'BUY' 
        ? (exitPrice - t.entryPrice) * t.quantity 
        : (t.entryPrice - exitPrice) * t.quantity;
      const netPnl = gross - charges;
      return {
        ...t,
        status: 'CLOSED',
        exitPrice,
        pnl: Math.round(netPnl * 100) / 100
      };
    }));
    setEditingTradeId(null);
    setTradeExitPriceVal('');
  };

  const handleDeleteTrade = (id: string) => {
    if (confirm("Are you sure you want to delete this option trade entry?")) {
      setOptionTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  // Portfolio Handlers
  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(invQty);
    const buyPriceNum = Number(invBuyPrice);
    const curPriceNum = invCurrentPrice ? Number(invCurrentPrice) : buyPriceNum;

    if (!invSymbol.trim() || isNaN(qtyNum) || isNaN(buyPriceNum) || qtyNum <= 0 || buyPriceNum <= 0) {
      alert("Please enter a valid ticker and average entry details.");
      return;
    }

    const newInv: PersonalInvestment = {
      id: 'p-inv-' + Date.now().toString(36),
      symbol: invSymbol.toUpperCase().trim(),
      category: invCategory,
      quantity: qtyNum,
      buyPrice: buyPriceNum,
      buyDate: invBuyDate,
      currentPrice: curPriceNum,
      status: 'HOLDING',
      comments: invComments
    };

    setPortfolio(prev => [newInv, ...prev]);
    setShowAddInv(false);
    
    setInvSymbol('');
    setInvQty('');
    setInvBuyPrice('');
    setInvCurrentPrice('');
    setInvComments('');
  };

  const handleUpdateCurrentPrice = (id: string, price: number) => {
    setPortfolio(prev => prev.map(item => item.id === id ? { ...item, currentPrice: price } : item));
    setEditingCmpId(null);
  };

  const handleExitInvestment = (id: string, sellPrice: number, sellDate: string) => {
    setPortfolio(prev => prev.map(item => item.id === id ? {
      ...item,
      status: 'EXITED',
      sellPrice,
      sellDate,
      currentPrice: sellPrice
    } : item));
    setExitingInvId(null);
    setExitPriceVal('');
  };

  const handleDeleteInvestment = (id: string) => {
    if (confirm("Delete this investment item from your portfolio?")) {
      setPortfolio(prev => prev.filter(item => item.id !== id));
    }
  };

  // States for Clear Ledger Countdown
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearCountdown, setClearCountdown] = useState<number | null>(null);

  // Clear countdown timer effect
  useEffect(() => {
    if (clearCountdown === null) return;
    if (clearCountdown === 0) {
      setOptionTrades([]);
      setPortfolio([]);
      localStorage.removeItem(PERSONAL_STORAGE_KEYS.OPTIONS);
      localStorage.removeItem(PERSONAL_STORAGE_KEYS.PORTFOLIO);
      setClearCountdown(null);
      setShowClearModal(false);
      return;
    }

    const timer = setTimeout(() => {
      setClearCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [clearCountdown]);

  // Generate Months List based on logs to check month-wise
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    
    // Add current month by default
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    months.add(cur);

    optionTrades.forEach(t => months.add(t.date.slice(0, 7)));
    portfolio.forEach(p => {
      months.add(p.buyDate.slice(0, 7));
      if (p.sellDate) months.add(p.sellDate.slice(0, 7));
    });

    const sortedMonths = Array.from(months).sort().reverse();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const name = monthNames[parseInt(month, 10) - 1];
      return { value: m, label: `${name} ${year}` };
    });
  }, [optionTrades, portfolio]);

  // Filters
  const filteredOptions = useMemo(() => {
    if (selectedMonth === 'ALL') return optionTrades;
    return optionTrades.filter(t => t.date.slice(0, 7) === selectedMonth || t.status === 'OPEN');
  }, [optionTrades, selectedMonth]);

  const filteredPortfolio = useMemo(() => {
    if (selectedMonth === 'ALL') return portfolio;
    return portfolio.filter(p => {
      const buyM = p.buyDate.slice(0, 7);
      const sellM = p.sellDate?.slice(0, 7);
      if (p.status === 'HOLDING') {
        return buyM <= selectedMonth;
      } else {
        return buyM === selectedMonth || sellM === selectedMonth;
      }
    });
  }, [portfolio, selectedMonth]);

  // Stats Calculations
  const stats = useMemo(() => {
    // Options
    const optOpen = filteredOptions.filter(t => t.status === 'OPEN');
    const optClosed = filteredOptions.filter(t => t.status === 'CLOSED');
    
    const realizedOptPnl = optClosed.reduce((sum, t) => sum + t.pnl, 0);
    const optChargesPaid = optClosed.reduce((sum, t) => sum + t.charges, 0) + optOpen.reduce((sum, t) => sum + t.charges, 0);
    
    const wins = optClosed.filter(t => t.pnl > 0);
    const winRate = optClosed.length === 0 ? 0 : (wins.length / optClosed.length) * 100;

    // Investment Portfolio
    const holdings = filteredPortfolio.filter(p => p.status === 'HOLDING');
    const exited = filteredPortfolio.filter(p => p.status === 'EXITED');

    const totalInvested = holdings.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
    const currentValuation = holdings.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
    const unrealizedPnl = currentValuation - totalInvested;
    const unrealizedPnlPercent = totalInvested === 0 ? 0 : (unrealizedPnl / totalInvested) * 100;

    const realizedInvPnl = exited.reduce((sum, p) => {
      const sellVal = (p.sellPrice || p.buyPrice) * p.quantity;
      const buyVal = p.buyPrice * p.quantity;
      return sum + (sellVal - buyVal);
    }, 0);

    return {
      optOpen,
      optClosed,
      realizedOptPnl: Math.round(realizedOptPnl * 100) / 100,
      optChargesPaid: Math.round(optChargesPaid * 100) / 100,
      winRate,
      winsCount: wins.length,
      lossesCount: optClosed.length - wins.length,
      holdings,
      exited,
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentValuation: Math.round(currentValuation * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      unrealizedPnlPercent: Math.round(unrealizedPnlPercent * 100) / 100,
      realizedInvPnl: Math.round(realizedInvPnl * 100) / 100
    };
  }, [filteredOptions, filteredPortfolio]);

  // Analytics Month-Wise Data
  const monthWiseBarData = useMemo(() => {
    const monthlyGroups: Record<string, { month: string; options: number; investments: number }> = {};
    
    // Group options P&L by month
    optionTrades.forEach(t => {
      if (t.status === 'CLOSED') {
        const m = t.date.slice(0, 7);
        if (!monthlyGroups[m]) monthlyGroups[m] = { month: m, options: 0, investments: 0 };
        monthlyGroups[m].options += t.pnl;
      }
    });

    // Group exited portfolio items P&L by sell month
    portfolio.forEach(p => {
      if (p.status === 'EXITED' && p.sellDate) {
        const m = p.sellDate.slice(0, 7);
        if (!monthlyGroups[m]) monthlyGroups[m] = { month: m, options: 0, investments: 0 };
        const sellVal = p.sellPrice! * p.quantity;
        const buyVal = p.buyPrice * p.quantity;
        monthlyGroups[m].investments += (sellVal - buyVal);
      }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Object.keys(monthlyGroups)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        const name = `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;
        return {
          name,
          Options: Math.round(monthlyGroups[key].options),
          Investments: Math.round(monthlyGroups[key].investments),
          Total: Math.round(monthlyGroups[key].options + monthlyGroups[key].investments)
        };
      });
  }, [optionTrades, portfolio]);

  const assetDistributionData = useMemo(() => {
    const sums: Record<string, number> = {};
    stats.holdings.forEach(p => {
      sums[p.category] = (sums[p.category] || 0) + (p.currentPrice * p.quantity);
    });

    return CATEGORIES.map(cat => ({
      name: cat.label,
      value: Math.round(sums[cat.value] || 0),
      color: cat.color
    })).filter(d => d.value > 0);
  }, [stats.holdings]);

  const formatRupees = (amount: number) => {
    const isNegative = amount < 0;
    const abs = Math.abs(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    return `${isNegative ? '-' : ''}₹${abs}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Desk */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/10">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center">
              Personal Trading Journal & Ledger
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mt-1">
              Private local ledger for tracking actual trade logs and portfolio holdings
            </p>
          </div>
        </div>

        {/* Global Month Selection filter */}
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5 space-x-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-mono font-black text-white focus:outline-none cursor-pointer pr-1 uppercase"
            >
              <option value="ALL" className="bg-slate-950">ALL RECORDS</option>
              {monthOptions.map(m => (
                <option key={m.value} value={m.value} className="bg-slate-950">{m.label.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setShowClearModal(true);
              setClearCountdown(null);
            }}
            className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 hover:border-rose-500/50 rounded-2xl text-[9px] font-black text-rose-400 uppercase tracking-wider transition-all cursor-pointer"
            title="Wipe local storage journal"
          >
            Clear Ledger
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/65 p-1 border border-slate-800/80 rounded-2xl w-full md:w-max">
        <button
          onClick={() => setActiveTab('options')}
          className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'options' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/25' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Personal Options Journal</span>
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'portfolio' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/25' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Personal Portfolio</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'insights' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/25' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LineIcon className="w-3.5 h-3.5" />
          <span>Analytics & Progress</span>
        </button>
      </div>

      {/* TAB 1: OPTIONS JOURNAL */}
      {activeTab === 'options' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Realized Options P&L</span>
              <h3 className={`text-lg font-black font-mono tracking-tight mt-1.5 ${stats.realizedOptPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatRupees(stats.realizedOptPnl)}
              </h3>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1 block">Net of brokerage taxes</span>
            </div>
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Options Trades</span>
              <h3 className="text-lg font-black font-mono mt-1.5 text-cyan-400">
                {stats.optOpen.length} Positions
              </h3>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1 block">Currently unhedged or holding</span>
            </div>
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Win Rate</span>
              <h3 className="text-lg font-black font-mono mt-1.5 text-white">
                {stats.winRate.toFixed(1)}%
              </h3>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1 block">{stats.winsCount} Wins / {stats.lossesCount} Losses</span>
            </div>
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Brokerage & Charges</span>
              <h3 className="text-lg font-black font-mono mt-1.5 text-slate-300">
                {formatRupees(stats.optChargesPaid)}
              </h3>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1 block">Estimated roundtrip expenses</span>
            </div>
          </div>

          {/* Core trade actions and list */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-tight">Personal Option Trade Records</span>
              </div>
              <button
                onClick={() => setShowAddOption(!showAddOption)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add My Trade</span>
              </button>
            </div>

            {/* Form for Options entry */}
            {showAddOption && (
              <form onSubmit={handleAddOptionTrade} className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/20 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Insert New Real Option trade</span>
                  </div>
                  <button type="button" onClick={() => setShowAddOption(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Trade Date</label>
                    <input type="date" value={optDate} onChange={e => setOptDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Underlying / Symbol</label>
                    <input type="text" value={optInstrument} onChange={e => setOptInstrument(e.target.value)} placeholder="NIFTY, RELIANCE, etc." className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold uppercase" required />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Strike Price</label>
                    <input type="number" value={optStrike} onChange={e => setOptStrike(e.target.value)} placeholder="e.g. 24500" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Option Type</label>
                    <div className="flex bg-slate-900 p-1 border border-slate-800 rounded-lg">
                      <button type="button" onClick={() => setOptType('CE')} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${optType === 'CE' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>CE</button>
                      <button type="button" onClick={() => setOptType('PE')} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${optType === 'PE' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>PE</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Action</label>
                    <div className="flex bg-slate-900 p-1 border border-slate-800 rounded-lg">
                      <button type="button" onClick={() => setOptAction('BUY')} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${optAction === 'BUY' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>BUY</button>
                      <button type="button" onClick={() => setOptAction('SELL')} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${optAction === 'SELL' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>SELL</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Quantity / Contracts</label>
                    <input type="number" value={optQty} onChange={e => setOptQty(e.target.value)} placeholder="e.g. 50" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Avg Entry Premium (₹)</label>
                    <input type="number" step="0.05" value={optEntryPrice} onChange={e => setOptEntryPrice(e.target.value)} placeholder="e.g. 105.40" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Trade Status</label>
                    <div className="flex bg-slate-900 p-1 border border-slate-800 rounded-lg">
                      <button type="button" onClick={() => setOptStatus('OPEN')} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${optStatus === 'OPEN' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>OPEN</button>
                      <button type="button" onClick={() => setOptStatus('CLOSED')} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${optStatus === 'CLOSED' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>CLOSED</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {optStatus === 'CLOSED' ? (
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Avg Exit Premium (₹)</label>
                      <input type="number" step="0.05" value={optExitPrice} onChange={e => setOptExitPrice(e.target.value)} placeholder="e.g. 145.20" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Stop Loss Trigger</label>
                        <input type="number" step="0.05" value={optStopLoss} onChange={e => setOptStopLoss(e.target.value)} placeholder="Optional SL" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Target Price</label>
                        <input type="number" step="0.05" value={optTarget} onChange={e => setOptTarget(e.target.value)} placeholder="Optional Target" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Brokerage & Taxes Paid (₹)</label>
                    <input type="number" value={optCharges} onChange={e => setOptCharges(e.target.value)} placeholder="e.g. 40" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Setup / Journal Comments</label>
                  <input type="text" value={optComments} onChange={e => setOptComments(e.target.value)} placeholder="Why did you take this trade? e.g. Pullback to EMA, breakout hedge, etc." className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-xs" />
                </div>

                <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all">
                  Commit Trade to Private Ledger
                </button>
              </form>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-slate-700 mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Option trade records logged</p>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Use the "Add My Trade" action above to record your live option trading logs locally.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-wider">
                      <th className="py-2 pb-3">Trade Date</th>
                      <th className="py-2 pb-3">Underlying Contract</th>
                      <th className="py-2 pb-3">Type</th>
                      <th className="py-2 pb-3">Contracts (Qty)</th>
                      <th className="py-2 pb-3">Avg Entry</th>
                      <th className="py-2 pb-3">Avg Exit</th>
                      <th className="py-2 pb-3">Net P&L</th>
                      <th className="py-2 pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-medium">
                    {filteredOptions.map(trade => {
                      const grossPnl = trade.exitPrice !== undefined
                        ? (trade.action === 'BUY' ? (trade.exitPrice - trade.entryPrice) : (trade.entryPrice - trade.exitPrice)) * trade.quantity
                        : 0;
                      const finalNet = trade.status === 'CLOSED' ? (trade.pnl) : (grossPnl - trade.charges);

                      return (
                        <tr key={trade.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="py-3 font-mono text-slate-400">{trade.date}</td>
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-white uppercase">{trade.instrument} {trade.strike} {trade.optionType}</span>
                              {trade.comments && <span className="text-[9px] text-slate-500 truncate max-w-[200px]" title={trade.comments}>"{trade.comments}"</span>}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${trade.action === 'BUY' ? 'bg-blue-600/10 text-blue-400' : 'bg-amber-600/10 text-amber-400'}`}>
                              {trade.action}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-300">{trade.quantity}</td>
                          <td className="py-3 font-mono text-slate-300">₹{trade.entryPrice.toFixed(2)}</td>
                          <td className="py-3 font-mono">
                            {trade.status === 'OPEN' ? (
                              editingTradeId === trade.id ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    step="0.05"
                                    placeholder="Exit"
                                    value={tradeExitPriceVal}
                                    onChange={e => setTradeExitPriceVal(e.target.value)}
                                    className="w-16 bg-slate-950 text-white text-[10px] p-1 border border-slate-800 rounded font-mono"
                                  />
                                  <button
                                    onClick={() => handleCloseOptionTrade(trade.id, Number(tradeExitPriceVal))}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                                  >
                                    <Save size={10} />
                                  </button>
                                  <button onClick={() => setEditingTradeId(null)} className="text-slate-500"><X size={10} /></button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingTradeId(trade.id); setTradeExitPriceVal(trade.entryPrice.toString()); }}
                                  className="px-2 py-0.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/25 rounded text-[8px] font-black uppercase"
                                >
                                  CLOSE POSITION
                                </button>
                              )
                            ) : (
                              <span className="text-slate-300">₹{trade.exitPrice?.toFixed(2)}</span>
                            )}
                          </td>
                          <td className={`py-3 font-mono font-bold`}>
                            {trade.status === 'OPEN' ? (
                              <span className="text-slate-500 text-[10px] uppercase">Holding</span>
                            ) : (
                              <span className={finalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {finalNet >= 0 ? '+' : ''}{formatRupees(finalNet)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleDeleteTrade(trade.id)} className="p-1 hover:bg-rose-950/40 text-slate-600 hover:text-rose-500 rounded transition-colors cursor-pointer">
                              <Trash2 size={13} />
                            </button>
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
      )}

      {/* TAB 2: PERSONAL PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Portfolio Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Holdings Cost Basis</span>
              <h3 className="text-lg font-black font-mono tracking-tight mt-1.5 text-white">
                {formatRupees(stats.totalInvested)}
              </h3>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1 block">Purchase capital deployed</span>
            </div>
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Current Valuation</span>
              <h3 className="text-lg font-black font-mono mt-1.5 text-cyan-400">
                {formatRupees(stats.currentValuation)}
              </h3>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1 block">Value at listed market CMP</span>
            </div>
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unrealized Growth</span>
              <h3 className={`text-lg font-black font-mono mt-1.5 ${stats.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.unrealizedPnl >= 0 ? '+' : ''}{formatRupees(stats.unrealizedPnl)}
              </h3>
              <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 block ${stats.unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.unrealizedPnl >= 0 ? '+' : ''}{stats.unrealizedPnlPercent.toFixed(2)}% Return
              </span>
            </div>
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Realized Capital Gains</span>
              <h3 className={`text-lg font-black font-mono mt-1.5 ${stats.realizedInvPnl >= 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {formatRupees(stats.realizedInvPnl)}
              </h3>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1 block">From exited portfolio logs</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Holdings Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-white uppercase tracking-tight">Active Portfolio Holdings</span>
                </div>
                <button
                  onClick={() => setShowAddInv(!showAddInv)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log Purchase</span>
                </button>
              </div>

              {/* Add Investment form */}
              {showAddInv && (
                <form onSubmit={handleAddInvestment} className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/20 space-y-4 animate-in slide-in-from-top-3 duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Insert Asset Purchase</span>
                    <button type="button" onClick={() => setShowAddInv(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Ticker / Asset Symbol</label>
                      <input type="text" value={invSymbol} onChange={e => setInvSymbol(e.target.value)} placeholder="e.g. INFY, GOLD" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold uppercase" required />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Asset Category</label>
                      <select value={invCategory} onChange={e => setInvCategory(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold">
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Purchase Date</label>
                      <input type="date" value={invBuyDate} onChange={e => setInvBuyDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Quantity / Shares</label>
                      <input type="number" value={invQty} onChange={e => setInvQty(e.target.value)} placeholder="e.g. 20" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Avg Cost Price (₹)</label>
                      <input type="number" step="0.05" value={invBuyPrice} onChange={e => setInvBuyPrice(e.target.value)} placeholder="e.g. 1502.50" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" required />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Latest CMP (₹)</label>
                      <input type="number" step="0.05" value={invCurrentPrice} onChange={e => setInvCurrentPrice(e.target.value)} placeholder="Same as purchase if unknown" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Investment Notes</label>
                    <input type="text" value={invComments} onChange={e => setInvComments(e.target.value)} placeholder="Long term core holding, ETF hedge, etc." className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs" />
                  </div>

                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all">
                    Insert Holdings Record
                  </button>
                </form>
              )}

              {stats.holdings.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Coins className="w-8 h-8 text-slate-700 mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No active asset holdings</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1">Deploy the forms above to start tracking your stock portfolios, mutual fund units, gold, or custom wealth indices.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.holdings.map(inv => {
                    const cost = inv.buyPrice * inv.quantity;
                    const value = inv.currentPrice * inv.quantity;
                    const pnl = value - cost;
                    const pnlPct = cost === 0 ? 0 : (pnl / cost) * 100;
                    const catLabel = CATEGORIES.find(c => c.value === inv.category)?.label || inv.category;

                    return (
                      <div key={inv.id} className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-colors">
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-mono uppercase tracking-tight">{catLabel}</span>
                            <span className="text-xs font-black text-white">{inv.symbol}</span>
                            <span className="text-[9px] font-mono text-slate-500">Qty: {inv.quantity} shares</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono mt-1 block">Bought: {inv.buyDate}</span>
                          {inv.comments && <p className="text-[9px] text-slate-400 italic mt-1">"{inv.comments}"</p>}
                        </div>

                        <div className="flex items-center space-x-5 flex-wrap md:flex-nowrap">
                          {/* Buy vs CMP */}
                          <div className="text-right font-mono text-[11px]">
                            <span className="text-[8px] text-slate-500 block uppercase font-sans">Avg Cost / CMP</span>
                            <span className="text-slate-400 font-bold">₹{inv.buyPrice}</span>
                            <span className="mx-1 text-slate-600">→</span>
                            {editingCmpId === inv.id ? (
                              <div className="inline-flex items-center space-x-1">
                                <input
                                  type="number"
                                  step="0.05"
                                  value={editingCmpVal}
                                  onChange={e => setEditingCmpVal(e.target.value)}
                                  className="w-16 bg-slate-900 border border-slate-700 rounded text-white p-0.5 text-[10px] font-mono"
                                />
                                <button
                                  onClick={() => handleUpdateCurrentPrice(inv.id, Number(editingCmpVal))}
                                  className="p-1 bg-cyan-600 rounded text-white text-[9px]"
                                >
                                  <Save size={8} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-emerald-400 font-black cursor-pointer group" onClick={() => { setEditingCmpId(inv.id); setEditingCmpVal(inv.currentPrice.toString()); }} title="Click to update market price">
                                ₹{inv.currentPrice} <Edit2 size={8} className="inline opacity-40 group-hover:opacity-100" />
                              </span>
                            )}
                          </div>

                          {/* Invested vs value */}
                          <div className="text-right font-mono text-[11px]">
                            <span className="text-[8px] text-slate-500 block uppercase font-sans">Deployment</span>
                            <span className="text-slate-400">₹{cost.toLocaleString('en-IN')}</span>
                          </div>

                          {/* PNL */}
                          <div className="text-right font-mono text-xs">
                            <span className="text-[8px] text-slate-500 block uppercase font-sans">Holding Gain/Loss</span>
                            <span className={`font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pnl >= 0 ? '+' : ''}{formatRupees(pnl)}
                            </span>
                            <span className={`text-[8px] font-bold block ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                            </span>
                          </div>

                          {/* Exit buttons */}
                          {exitingInvId === inv.id ? (
                            <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-rose-500/20 rounded">
                              <input
                                type="number"
                                step="0.05"
                                placeholder="Sell Premium"
                                value={exitPriceVal}
                                onChange={e => setExitPriceVal(e.target.value)}
                                className="w-16 bg-slate-950 text-white text-[9px] font-mono border border-slate-800 p-0.5"
                              />
                              <button
                                onClick={() => handleExitInvestment(inv.id, Number(exitPriceVal), exitDateVal)}
                                className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer"
                              >
                                Sell
                              </button>
                              <button onClick={() => setExitingInvId(null)} className="text-slate-500"><X size={8} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setExitingInvId(inv.id); setExitPriceVal(inv.currentPrice.toString()); }}
                              className="px-2 py-1 bg-rose-950/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-900/40 hover:border-rose-500/20 rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer transition-all"
                            >
                              Exit Asset
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Asset distribution widget */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between h-full min-h-[300px]">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black text-white uppercase tracking-tight">Wealth Distribution</span>
                </div>

                {assetDistributionData.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                    Log asset purchases to display sector weights
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-[140px] flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetDistributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={3}
                          >
                            {assetDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Total Wealth</span>
                        <span className="text-xs font-mono font-black text-white">{formatRupees(stats.currentValuation)}</span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/40">
                      {assetDistributionData.map((d, index) => {
                        const pct = stats.currentValuation === 0 ? 0 : (d.value / stats.currentValuation) * 100;
                        return (
                          <div key={index} className="flex items-center justify-between py-1.5 text-[10px]">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="text-slate-300 font-bold">{d.name}</span>
                            </div>
                            <span className="font-mono text-slate-400 font-bold">{pct.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Asset Exited Portfolio logs */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black text-white uppercase tracking-tight">Exited Asset Transactions Ledger</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {stats.exited.length} exited transaction(s)
              </span>
            </div>

            {stats.exited.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                No asset sales exited in this period log
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-wider">
                      <th className="py-2 pb-3">Symbol</th>
                      <th className="py-2 pb-3">Sector Class</th>
                      <th className="py-2 pb-3">Cost Basis Deployment</th>
                      <th className="py-2 pb-3">Liquidation Amount</th>
                      <th className="py-2 pb-3">Gains Realized</th>
                      <th className="py-2 pb-3">Purchase Date</th>
                      <th className="py-2 pb-3">Exit Date</th>
                      <th className="py-2 pb-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {stats.exited.map(item => {
                      const cost = item.buyPrice * item.quantity;
                      const salesVal = (item.sellPrice || item.buyPrice) * item.quantity;
                      const netReturn = salesVal - cost;
                      const catLabel = CATEGORIES.find(c => c.value === item.category)?.label || item.category;

                      return (
                        <tr key={item.id} className="hover:bg-slate-950/20 text-slate-300">
                          <td className="py-3 font-bold text-white uppercase">{item.symbol}</td>
                          <td className="py-3 text-[10px] text-slate-400 font-bold">{catLabel}</td>
                          <td className="py-3 font-mono">₹{cost.toLocaleString()}</td>
                          <td className="py-3 font-mono">₹{salesVal.toLocaleString()}</td>
                          <td className={`py-3 font-mono font-bold ${netReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {netReturn >= 0 ? '+' : ''}{formatRupees(netReturn)}
                          </td>
                          <td className="py-3 font-mono text-[10px] text-slate-500">{item.buyDate}</td>
                          <td className="py-3 font-mono text-[10px] text-slate-500">{item.sellDate || '--'}</td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleDeleteInvestment(item.id)} className="p-1 text-slate-600 hover:text-rose-500 rounded cursor-pointer">
                              <Trash2 size={13} />
                            </button>
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
      )}

      {/* TAB 3: MONTHLY ANALYTICS & CHARTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Realized Ledger summary stats */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-tight">Ledger Performance Audit</span>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Consolidated Realized P&L</span>
                    <span className="text-[9px] text-slate-400">Total closed trades + liquidated holdings</span>
                  </div>
                  <span className={`text-sm font-black font-mono ${(stats.realizedOptPnl + stats.realizedInvPnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(stats.realizedOptPnl + stats.realizedInvPnl) >= 0 ? '+' : ''}
                    {formatRupees(stats.realizedOptPnl + stats.realizedInvPnl)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Options Profit</span>
                    <span className={`text-xs font-bold font-mono block mt-1 ${stats.realizedOptPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatRupees(stats.realizedOptPnl)}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Portfolio Profit</span>
                    <span className={`text-xs font-bold font-mono block mt-1 ${stats.realizedInvPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatRupees(stats.realizedInvPnl)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs px-2 pt-2 text-slate-400">
                  <span>Total Charges Paid:</span>
                  <span className="font-mono text-slate-200">{formatRupees(stats.optChargesPaid)}</span>
                </div>

                <div className="flex justify-between items-center text-xs px-2 text-slate-400">
                  <span>Option Win/Loss Ratio:</span>
                  <span className="font-bold text-slate-200">{stats.winsCount} Wins / {stats.lossesCount} Losses</span>
                </div>

                <div className="p-3 bg-cyan-950/20 border border-cyan-800/20 rounded-2xl flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-cyan-400 leading-normal">
                    This analysis compiles closed-loop accounts. Add any stock sale values or roundtrip option settlements to maintain accuracy. Active portfolio positions represent paper floating value.
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Profit/Loss chart */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
                  <LineIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black text-white uppercase tracking-tight">Month-Wise Realized Outcomes</span>
                </div>

                {monthWiseBarData.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    No closed contracts plotted yet for historical monthly gains
                  </div>
                ) : (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthWiseBarData}>
                        <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '9px' }}
                          itemStyle={{ fontWeight: 'black', fontSize: '11px' }}
                          formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Profit']}
                        />
                        <Bar dataKey="Total" radius={[4, 4, 0, 0]}>
                          {monthWiseBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.Total >= 0 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <span className="text-[8px] text-slate-500 text-center uppercase tracking-widest leading-none mt-4 block">
                Visualizing cumulative settlements categorized month-by-month
              </span>
            </div>
          </div>
        </div>
      )}
      {/* LEDGER CLEAR CONFIRMATION & COUNTDOWN MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200" id="clear-ledger-modal">
          <div className="bg-slate-900 border border-rose-500/30 p-6 rounded-3xl max-w-md w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {clearCountdown === null ? (
              <>
                <div className="flex items-center space-x-3 text-rose-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Confirm Ledger Wipe</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are about to permanently delete all logs in your Personal Trading Journal and Portfolio. 
                  This will wipe all active options and investments entries from local storage.
                </p>
                <div className="p-3 bg-rose-950/20 border border-rose-900/20 rounded-2xl">
                  <p className="text-[10px] text-rose-400 leading-normal uppercase font-bold tracking-wider">
                    ⚠️ Irreversible action. Once cleared, your logs cannot be recovered.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setClearCountdown(15)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Yes, Proceed
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin duration-1000"></div>
                  <span className="text-3xl font-black font-mono text-rose-400">{clearCountdown}</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Clearing Ledger in Progress</h3>
                  <p className="text-[11px] text-slate-400">
                    A 15-second safety grace period is active. Click below to immediately abort the deletion.
                  </p>
                </div>

                <div className="bg-rose-950/30 border border-rose-500/20 p-3 rounded-2xl animate-pulse">
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                    ⚠️ DELETING PERSONAL TRADING DATA...
                  </p>
                </div>

                <button
                  onClick={() => {
                    setClearCountdown(null);
                    setShowClearModal(false);
                  }}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
                >
                  ABORT AND CANCEL ACTION
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalJournal;
