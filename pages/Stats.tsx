
import React, { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TradeSignal, TradeStatus, MonthlyRealization, User, OptionType } from '../types';
import { TrendingUp, BarChart3, Filter, Award, Clock, Layers, Briefcase, History as HistoryIcon, Zap, Calendar, LineChart as LineChartIcon, X, Check, Loader2, Info, ChevronsUpDown } from 'lucide-react';
import { updateSheetData } from '../services/googleSheetsService';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const pnl = payload[0].value || 0;
    const color = pnl >= 0 ? '#10b981' : '#f43f5e';
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] uppercase font-black tracking-widest mb-1" style={{ color }}>
          {label}
        </p>
        <p className="text-sm font-mono font-black" style={{ color }}>
          ₹{pnl.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

const Stats: React.FC<{ 
  signals?: (TradeSignal & { sheetIndex?: number })[]; 
  historySignals?: TradeSignal[];
  monthlyRealization?: MonthlyRealization[];
  user?: User | null;
}> = ({ signals = [], historySignals = [], monthlyRealization = [], user }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const monthContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number | string>('100%');
  const [monthChartWidth, setMonthChartWidth] = useState<number | string>('100%');
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setChartWidth(Math.floor(entry.contentRect.width));
        if (monthContainerRef.current) {
          setMonthChartWidth(Math.floor(monthContainerRef.current.clientWidth));
        }
        setIsReady(true);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const normalizeDate = (trade: TradeSignal): string => {
    const ts = trade.lastTradedTimestamp || trade.date || trade.timestamp;
    if (!ts) return '';
    if ((ts as any) instanceof Date || (typeof ts === 'string' && ts.includes('T'))) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    }
    const rawDate = String(ts).trim();
    if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts[0].length === 4) return rawDate;
      if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
        return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return '';
  };

  const performance = useMemo(() => {
    const now = new Date();
    
    // Audit start date: 1st of the month 3 months ago (current month + 3 previous months)
    const auditStartDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const auditStartDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(auditStartDate);

    // Calculate exact calendar days from auditStartDate to today, capped at 120
    const startOfCurrentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = startOfCurrentDay.getTime() - auditStartDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    const exactAuditDays = Math.min(diffDays, 120);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(thirtyDaysAgo);
    
    const unifiedMap = new Map<string, TradeSignal>();
    (signals || []).forEach(s => {
      if (s.status === TradeStatus.EXITED || s.status === TradeStatus.STOPPED || s.status === TradeStatus.ALL_TARGET) {
        if (s.id) unifiedMap.set(s.id, s);
      }
    });
    (historySignals || []).forEach(s => {
      const id = s.id || `hist-${normalizeDate(s)}-${s.symbol}-${s.entryPrice}`;
      unifiedMap.set(id, s);
    });

    const combinedHistory = Array.from(unifiedMap.values());

    // Helper to get underlying asset name from trade instrument or symbol
    const getUnderlyingAsset = (t: TradeSignal) => {
      if (t.instrument && t.instrument.trim() !== '') {
        return t.instrument.toUpperCase().trim();
      }
      const sym = (t.symbol || '').trim();
      const firstWord = sym.split(/\s+/)[0] || '';
      return firstWord.toUpperCase().trim();
    };

    // Group BTST trades on the same day for the same asset
    const groupedHistory: TradeSignal[] = [];
    const btstGroups: Record<string, TradeSignal[]> = {};
    const nonGrouped: TradeSignal[] = [];

    combinedHistory.forEach(trade => {
      const dateStr = normalizeDate(trade);
      if (trade.isBTST && dateStr) {
        const asset = getUnderlyingAsset(trade);
        const groupKey = `${dateStr}_${asset}`;
        if (!btstGroups[groupKey]) {
          btstGroups[groupKey] = [];
        }
        btstGroups[groupKey].push(trade);
      } else {
        nonGrouped.push(trade);
      }
    });

    Object.entries(btstGroups).forEach(([groupKey, trades]) => {
      if (trades.length <= 1) {
        groupedHistory.push(...trades);
      } else {
        const [dateStr, asset] = groupKey.split('_');
        let totalPnlRupees: number | undefined = undefined;
        let totalPnlPoints = 0;
        let anyHasRupees = false;

        trades.forEach(t => {
          const qty = Number(t.quantity && t.quantity > 0 ? t.quantity : 1);
          const rs = t.pnlRupees !== undefined ? t.pnlRupees : (t.pnlPoints || 0) * qty;
          if (t.pnlRupees !== undefined) {
            anyHasRupees = true;
          }
          if (totalPnlRupees === undefined) {
            totalPnlRupees = 0;
          }
          totalPnlRupees += rs;
          totalPnlPoints += (t.pnlPoints || 0);
        });

        const combinedTrade: TradeSignal = {
          id: `grouped-btst-${groupKey}`,
          date: dateStr,
          timestamp: trades[0].timestamp || dateStr,
          lastTradedTimestamp: trades[0].lastTradedTimestamp || trades[0].date || trades[0].timestamp,
          instrument: asset,
          symbol: `${asset} CE/PE Combined BTST`,
          type: OptionType.CE,
          isBTST: true,
          quantity: 1,
          pnlRupees: anyHasRupees ? totalPnlRupees : undefined,
          pnlPoints: totalPnlPoints,
          action: 'BUY',
          entryPrice: 0,
          stopLoss: 0,
          targets: [],
          status: TradeStatus.EXITED,
        };

        groupedHistory.push(combinedTrade);
      }
    });

    const finalHistory = [...nonGrouped, ...groupedHistory];
    
    // Month prefix for current month filtering (e.g. "2026-07")
    const currentMonthPrefix = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(now);

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const fullMonthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Compute Monthly Breakdown (including Fallback Logic from Metrics Sheet per month)
    const monthlyBreakdown: any[] = [];
    
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const year = d.getFullYear();
      const monthPrefix = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
      
      const monShort = monthNames[mIdx];
      const sheetMonthKey = `${monShort}/${year}`;

      const monthTrades = finalHistory.filter(trade => {
        const tradeDateStr = normalizeDate(trade);
        return tradeDateStr && tradeDateStr.startsWith(monthPrefix);
      });

      const overallScores: number[] = [];
      const intradayScores: number[] = [];
      const overnightScores: number[] = [];
      let totalPnL = 0;
      let stockPnL = 0;
      let indexPnL = 0;
      let tradeCount = 0;

      monthTrades.forEach(trade => {
        const qty = Number(trade.quantity && trade.quantity > 0 ? trade.quantity : 1);
        const pnlValue = Number(trade.pnlRupees !== undefined ? trade.pnlRupees : (trade.pnlPoints || 0) * qty);
        const successScore = Number(trade.pnlRupees !== undefined ? trade.pnlRupees : (trade.pnlPoints || 0));

        const instrument = trade.instrument || '';
        const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];
        const isIdx = indices.includes(instrument.toUpperCase());

        overallScores.push(successScore);
        if (trade.isBTST) {
          overnightScores.push(successScore);
        } else {
          intradayScores.push(successScore);
        }
        totalPnL += pnlValue;
        if (isIdx) {
          indexPnL += pnlValue;
        } else {
          stockPnL += pnlValue;
        }
        tradeCount++;
      });

      const calculateConsistency = (list: number[]) => {
        const filteredList = list.filter(v => v !== 0);
        if (filteredList.length === 0) return null;
        const successCount = filteredList.filter(v => v > 0).length;
        return (successCount / filteredList.length) * 100;
      };

      const historyOverall = calculateConsistency(overallScores);
      const historyIntraday = calculateConsistency(intradayScores);
      const historyOvernight = calculateConsistency(overnightScores);

      const sheetMetric = (monthlyRealization || []).find(m => m.month.toUpperCase() === sheetMonthKey);
      const hasHistoryTrades = tradeCount > 0;

      const finalIntraday = (sheetMetric && sheetMetric.intraday !== undefined && sheetMetric.intraday !== null)
        ? sheetMetric.intraday
        : (hasHistoryTrades && historyIntraday !== null ? historyIntraday : 0);

      const finalOvernight = (sheetMetric && sheetMetric.overnight !== undefined && sheetMetric.overnight !== null)
        ? sheetMetric.overnight
        : (hasHistoryTrades && historyOvernight !== null ? historyOvernight : 0);

      const hasIntradayData = (sheetMetric && sheetMetric.intraday !== undefined && sheetMetric.intraday !== null)
        || (hasHistoryTrades && historyIntraday !== null);

      const hasOvernightData = (sheetMetric && sheetMetric.overnight !== undefined && sheetMetric.overnight !== null)
        || (hasHistoryTrades && historyOvernight !== null);

      let finalOverall = 0;
      if (hasIntradayData && hasOvernightData) {
        finalOverall = (finalIntraday + finalOvernight) / 2;
      } else if (hasIntradayData) {
        finalOverall = finalIntraday;
      } else if (hasOvernightData) {
        finalOverall = finalOvernight;
      } else {
        finalOverall = 0;
      }
      
      const finalPnL = totalPnL + (sheetMetric?.realization ?? 0);
      const finalCount = tradeCount + (sheetMetric?.count ?? 0);
      
      const finalStockPnL = stockPnL + (sheetMetric?.realization !== undefined ? sheetMetric.realization * 0.4 : 0);
      const finalIndexPnL = indexPnL + (sheetMetric?.realization !== undefined ? sheetMetric.realization * 0.6 : 0);

      monthlyBreakdown.push({
        label: `${fullMonthNames[mIdx]} ${year}`,
        shortLabel: `${monShort} ${String(year).slice(-2)}`,
        monthKey: sheetMonthKey,
        isCurrent: i === 0,
        overall: finalOverall,
        intraday: finalIntraday,
        overnight: finalOvernight,
        pnl: finalPnL,
        count: finalCount,
        stockPnL: finalStockPnL,
        indexPnL: finalIndexPnL,
        hasHistory: hasHistoryTrades
      });
    }

    const currentMonth = monthlyBreakdown[0];

    // Rolling statistics are computed by combining or averaging the monthly metrics from monthlyBreakdown
    const overallPercent = monthlyBreakdown.reduce((sum, m) => sum + m.overall, 0) / monthlyBreakdown.length;
    const intradayPercent = monthlyBreakdown.reduce((sum, m) => sum + m.intraday, 0) / monthlyBreakdown.length;
    const overnightPercent = monthlyBreakdown.reduce((sum, m) => sum + m.overnight, 0) / monthlyBreakdown.length;

    // Rolling 30-day outcomes: compute from actual history in the last 30 days as first preference, fall back to current month's values otherwise
    const tradesLast30Days = finalHistory.filter(trade => {
      const tradeDateStr = normalizeDate(trade);
      return tradeDateStr && tradeDateStr >= thirtyDaysAgoStr;
    });

    let rollingPnL = 0;
    let indexPnL = 0;
    let stockPnL = 0;

    if (tradesLast30Days.length > 0) {
      tradesLast30Days.forEach(trade => {
        const qty = Number(trade.quantity && trade.quantity > 0 ? trade.quantity : 1);
        const pnlValue = Number(trade.pnlRupees !== undefined ? trade.pnlRupees : (trade.pnlPoints || 0) * qty);
        const instrument = trade.instrument || '';
        const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];
        const isIdx = indices.includes(instrument.toUpperCase());

        rollingPnL += pnlValue;
        if (isIdx) indexPnL += pnlValue; else stockPnL += pnlValue;
      });
    } else {
      rollingPnL = currentMonth.pnl;
      indexPnL = currentMonth.indexPnL;
      stockPnL = currentMonth.stockPnL;
    }

    let earliestAuditDate: string | null = null;
    let latestAuditDate: string | null = null;

    // Find the earliest date among months in monthlyBreakdown that have data (either history or sheetMetric)
    for (let idx = monthlyBreakdown.length - 1; idx >= 0; idx--) {
      const m = monthlyBreakdown[idx];
      const hasMetricData = (monthlyRealization || []).some(sheetM => sheetM.month.toUpperCase() === m.monthKey.toUpperCase());
      if (m.hasHistory) {
        const [monShort, yrStr] = m.monthKey.split('/');
        const mIdx = monthNames.indexOf(monShort.toUpperCase());
        const monthPrefix = `${yrStr}-${String(mIdx + 1).padStart(2, '0')}`;
        const monthTradeDates = finalHistory
          .map(t => normalizeDate(t))
          .filter((d): d is string => !!d && d.startsWith(monthPrefix))
          .sort();
        if (monthTradeDates.length > 0) {
          earliestAuditDate = monthTradeDates[0];
          break;
        }
      } else if (hasMetricData) {
        const [monShort, yrStr] = m.monthKey.split('/');
        const mIdx = monthNames.indexOf(monShort.toUpperCase());
        earliestAuditDate = `${yrStr}-${String(mIdx + 1).padStart(2, '0')}-01`;
        break;
      }
    }

    // Find the latest date among months in monthlyBreakdown that have data
    for (let idx = 0; idx < monthlyBreakdown.length; idx++) {
      const m = monthlyBreakdown[idx];
      const hasMetricData = (monthlyRealization || []).some(sheetM => sheetM.month.toUpperCase() === m.monthKey.toUpperCase());
      if (m.isCurrent && (m.hasHistory || hasMetricData)) {
        latestAuditDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
        break;
      }
      if (m.hasHistory) {
        const [monShort, yrStr] = m.monthKey.split('/');
        const mIdx = monthNames.indexOf(monShort.toUpperCase());
        const monthPrefix = `${yrStr}-${String(mIdx + 1).padStart(2, '0')}`;
        const monthTradeDates = finalHistory
          .map(t => normalizeDate(t))
          .filter((d): d is string => !!d && d.startsWith(monthPrefix))
          .sort();
        if (monthTradeDates.length > 0) {
          latestAuditDate = monthTradeDates[monthTradeDates.length - 1];
          break;
        }
      } else if (hasMetricData) {
        const [monShort, yrStr] = m.monthKey.split('/');
        const mIdx = monthNames.indexOf(monShort.toUpperCase());
        const year = parseInt(yrStr);
        const lastDay = new Date(year, mIdx + 1, 0).getDate();
        latestAuditDate = `${yrStr}-${String(mIdx + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        break;
      }
    }

    if (!earliestAuditDate) {
      earliestAuditDate = auditStartDateStr;
    }
    if (!latestAuditDate) {
      latestAuditDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    }

    const chartMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      chartMap[new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d)] = 0;
    }

    finalHistory.forEach(trade => {
      const tradeDateStr = normalizeDate(trade);
      if (!tradeDateStr) return;

      const qty = Number(trade.quantity && trade.quantity > 0 ? trade.quantity : 1);
      const pnlValue = Number(trade.pnlRupees !== undefined ? trade.pnlRupees : (trade.pnlPoints || 0) * qty);
      
      if (chartMap[tradeDateStr] !== undefined) chartMap[tradeDateStr] += pnlValue;
    });

    let receivedDays = exactAuditDays;
    if (earliestAuditDate && latestAuditDate) {
      const d1 = new Date(earliestAuditDate);
      const d2 = new Date(latestAuditDate);
      const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
      const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
      receivedDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1;
    }

    const formatDate = (isoStr: string | null) => {
      if (!isoStr) return '--';
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();
    };

    const currentMonthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    return {
      rollingPnL,
      indexPnL,
      stockPnL,
      overallPercent,
      intradayPercent,
      overnightPercent,

      currentMonthPnL: currentMonth.pnl,
      currentMonthIndexPnL: currentMonth.indexPnL,
      currentMonthStockPnL: currentMonth.stockPnL,
      currentMonthOverall: currentMonth.overall,
      currentMonthIntraday: currentMonth.intraday,
      currentMonthOvernight: currentMonth.overnight,
      currentMonthTradeCount: currentMonth.count,
      currentMonthStart: formatDate(currentMonthStartStr),
      currentMonthEnd: formatDate(now.toISOString()),

      auditStart: formatDate(earliestAuditDate || auditStartDateStr),
      auditEnd: formatDate(latestAuditDate || now.toISOString()),
      auditDays: exactAuditDays,
      receivedDays,
      chartData: Object.entries(chartMap).map(([date, pnl]) => ({ 
        date: date.split('-').reverse().slice(0, 2).join('/'), 
        pnl 
      })),
      monthlyChartData: (() => {
        const list = [];
        const now = new Date();
        
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mIdx = d.getMonth();
          const year = d.getFullYear();
          const monShort = monthNames[mIdx];
          const sheetMonthKey = `${monShort}/${year}`;
          const monthPrefix = `${year}-${String(mIdx + 1).padStart(2, '0')}`;

          // Calculate from history+signals first
          const monthTrades = finalHistory.filter(trade => {
            const tradeDateStr = normalizeDate(trade);
            return tradeDateStr && tradeDateStr.startsWith(monthPrefix);
          });

          let realization = 0;
          if (monthTrades.length > 0) {
            realization = monthTrades.reduce((sum, trade) => {
              const qty = Number(trade.quantity && trade.quantity > 0 ? trade.quantity : 1);
              const pnl = Number(trade.pnlRupees !== undefined ? trade.pnlRupees : (trade.pnlPoints || 0) * qty);
              return sum + pnl;
            }, 0);
          } else {
            // Fallback to metrics sheet
            const sheetMetric = (monthlyRealization || []).find(m => m.month.toUpperCase() === sheetMonthKey);
            realization = sheetMetric?.realization ?? 0;
          }

          list.push({
            month: sheetMonthKey,
            realization
          });
        }
        return list;
      })(),
      monthlyBreakdown
    };
  }, [signals, historySignals, monthlyRealization]);

  const [isPublishing, setIsPublishing] = useState<Record<string, boolean>>({});

  const { monthlyBreakdown } = performance;

  const handlePublishMetrics = async (monthData: any, silent = false) => {
    const monthKey = monthData.monthKey;
    setIsPublishing(prev => ({ ...prev, [monthKey]: true }));
    
    const payload = {
      month: monthKey,
      realization: Number(monthData.pnl),
      overall: Number(monthData.overall.toFixed(1)),
      intraday: Number(monthData.intraday.toFixed(1)),
      overnight: Number(monthData.overnight.toFixed(1)),
      count: Number(monthData.count)
    };

    const success = await updateSheetData('metrics', 'ADD', payload, monthKey);
    
    if (!silent) {
      if (success) {
        alert(`🟢 Successful Synchronization!\n\nMetrics for ${monthData.label} have been successfully published to the Google Sheet tab.`);
      } else {
        alert(`🔴 Publishing failed. Verify sheet configurations.`);
      }
    }
    
    setIsPublishing(prev => ({ ...prev, [monthKey]: false }));
  };

  const getConsistencyColor = (percent: number) => {
    if (percent < 50) return 'text-rose-500';
    if (percent < 60) return 'text-yellow-500';
    
    // Above 60%: Darkening Green logic (each 5% turns to dark)
    if (percent < 65) return 'text-emerald-400';
    if (percent < 70) return 'text-emerald-500';
    if (percent < 75) return 'text-emerald-600';
    if (percent < 80) return 'text-emerald-700';
    if (percent < 85) return 'text-emerald-800';
    return 'text-emerald-900'; 
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center">
            <TrendingUp size={24} className="mr-2 text-yellow-500" />
            Performance & Efficiency Metrics
          </h2>
          <p className="text-slate-400 text-[10px] font-mono font-black uppercase tracking-widest leading-none mb-3">
            Institutional Realization & Consistency Auditing
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
             <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400">
                <span className="text-slate-500 uppercase font-black tracking-tighter">Current Month:</span>
                <span className="text-blue-500 font-bold">{performance.currentMonthStart} – {performance.currentMonthEnd}</span>
                <span className="text-slate-600">|</span>
                <span className="text-blue-500 font-bold">{performance.currentMonthTradeCount} TRADES</span>
             </div>
             <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400">
                <span className="text-slate-500 uppercase font-black tracking-tighter">Audit Window:</span>
                <span className="text-yellow-500 font-bold">{performance.auditStart} – {performance.auditEnd}</span>
                <span className="text-slate-600">|</span>
                <span className="text-yellow-500 font-bold">LAST {performance.receivedDays} DAYS</span>
             </div>
          </div>
        </div>
      </div>

      {/* INTEGRATED METRICS GRID (Current Month vs Rolling Audit Detail with selector) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatItem 
          label="Net Outcome" 
          metricKey="pnl"
          isPnL={true}
          defaultCurrentVal={`${performance.currentMonthPnL >= 0 ? '+' : ''}${formatCurrency(performance.currentMonthPnL)}`}
          defaultCurrentValColorClass={performance.currentMonthPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          defaultRollingVal={`${performance.rollingPnL >= 0 ? '+' : ''}${formatCurrency(performance.rollingPnL)}`}
          defaultRollingValColorClass={performance.rollingPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          icon={HistoryIcon} 
          highlight={true} 
          rollingLabel="last 30 days"
          monthlyData={monthlyBreakdown}
          getConsistencyColor={getConsistencyColor}
          formatCurrency={formatCurrency}
          user={user}
          isPublishing={isPublishing}
          handlePublishMetrics={handlePublishMetrics}
        />
        <StatItem 
          label="Consistency Ratio" 
          metricKey="overall"
          isPnL={false}
          defaultCurrentVal={`${performance.currentMonthOverall.toFixed(1)}%`}
          defaultCurrentValColorClass={getConsistencyColor(performance.currentMonthOverall)}
          defaultRollingVal={`${performance.overallPercent.toFixed(1)}%`}
          defaultRollingValColorClass={getConsistencyColor(performance.overallPercent)}
          icon={Award}
          highlight={true}
          rollingLabel={`last ${performance.receivedDays} days`}
          monthlyData={monthlyBreakdown}
          getConsistencyColor={getConsistencyColor}
          formatCurrency={formatCurrency}
          user={user}
          isPublishing={isPublishing}
          handlePublishMetrics={handlePublishMetrics}
        />
        
        <StatItem 
          label="Stock Net Outcome" 
          metricKey="stockPnL"
          isPnL={true}
          defaultCurrentVal={`${performance.currentMonthStockPnL >= 0 ? '+' : ''}${formatCurrency(performance.currentMonthStockPnL)}`}
          defaultCurrentValColorClass={performance.currentMonthStockPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          defaultRollingVal={`${performance.stockPnL >= 0 ? '+' : ''}${formatCurrency(performance.stockPnL)}`}
          defaultRollingValColorClass={performance.stockPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          icon={Briefcase} 
          rollingLabel="last 30 days"
          monthlyData={monthlyBreakdown}
          getConsistencyColor={getConsistencyColor}
          formatCurrency={formatCurrency}
          user={user}
          isPublishing={isPublishing}
          handlePublishMetrics={handlePublishMetrics}
        />
        <StatItem 
          label="Intraday Consistency" 
          metricKey="intraday"
          isPnL={false}
          defaultCurrentVal={`${performance.currentMonthIntraday.toFixed(1)}%`}
          defaultCurrentValColorClass={getConsistencyColor(performance.currentMonthIntraday)}
          defaultRollingVal={`${performance.intradayPercent.toFixed(1)}%`}
          defaultRollingValColorClass={getConsistencyColor(performance.intradayPercent)}
          icon={Zap}
          rollingLabel={`last ${performance.receivedDays} days`}
          monthlyData={monthlyBreakdown}
          getConsistencyColor={getConsistencyColor}
          formatCurrency={formatCurrency}
          user={user}
          isPublishing={isPublishing}
          handlePublishMetrics={handlePublishMetrics}
        />
        
        <StatItem 
          label="Index Net Outcome" 
          metricKey="indexPnL"
          isPnL={true}
          defaultCurrentVal={`${performance.currentMonthIndexPnL >= 0 ? '+' : ''}${formatCurrency(performance.currentMonthIndexPnL)}`}
          defaultCurrentValColorClass={performance.currentMonthIndexPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          defaultRollingVal={`${performance.indexPnL >= 0 ? '+' : ''}${formatCurrency(performance.indexPnL)}`}
          defaultRollingValColorClass={performance.indexPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          icon={Layers} 
          rollingLabel="last 30 days"
          monthlyData={monthlyBreakdown}
          getConsistencyColor={getConsistencyColor}
          formatCurrency={formatCurrency}
          user={user}
          isPublishing={isPublishing}
          handlePublishMetrics={handlePublishMetrics}
        />
        <StatItem 
          label="Overnight Consistency" 
          metricKey="overnight"
          isPnL={false}
          defaultCurrentVal={`${performance.currentMonthOvernight.toFixed(1)}%`}
          defaultCurrentValColorClass={getConsistencyColor(performance.currentMonthOvernight)}
          defaultRollingVal={`${performance.overnightPercent.toFixed(1)}%`}
          defaultRollingValColorClass={getConsistencyColor(performance.overnightPercent)}
          icon={Clock}
          rollingLabel={`last ${performance.receivedDays} days`}
          monthlyData={monthlyBreakdown}
          getConsistencyColor={getConsistencyColor}
          formatCurrency={formatCurrency}
          user={user}
          isPublishing={isPublishing}
          handlePublishMetrics={handlePublishMetrics}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-white font-bold flex items-center text-sm uppercase tracking-widest">
                <BarChart3 size={16} className="mr-3 text-blue-500" />
                Realized Trend
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">14-Day Rolling Realization Curve</p>
            </div>
        </div>
        
        <div 
          ref={containerRef}
          className="w-full relative z-10 block" 
          style={{ height: '300px', minWidth: '0px', minHeight: '300px', overflow: 'hidden' }}
        >
          {isReady && (
            <ResponsiveContainer width={chartWidth as any} height={300} debounce={50}>
              <BarChart data={performance.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} tickFormatter={(val) => `₹${Math.abs(val) >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(30, 41, 59, 0.2)'}} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]} barSize={35}>
                  {performance.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-white font-bold flex items-center text-sm uppercase tracking-widest">
                <LineChartIcon size={16} className="mr-3 text-emerald-500" />
                Monthly Realization
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">14-Month Realization Curve</p>
            </div>
        </div>
        
        <div 
          ref={monthContainerRef}
          className="w-full relative z-10 block" 
          style={{ height: '300px', minWidth: '0px', minHeight: '300px', overflow: 'hidden' }}
        >
          {isReady && (
            <ResponsiveContainer width={monthChartWidth as any} height={300} debounce={50}>
              <BarChart data={performance.monthlyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} tickFormatter={(val) => `₹${Math.abs(val) >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(30, 41, 59, 0.2)'}} />
                <Bar dataKey="realization" radius={[6, 6, 0, 0]} barSize={35}>
                  {performance.monthlyChartData.map((entry, index) => <Cell key={`cell-month-${index}`} fill={entry.realization >= 0 ? '#10b981' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};

const StatItem = ({ 
  label, 
  metricKey,
  isPnL,
  defaultCurrentVal, 
  defaultCurrentValColorClass, 
  defaultRollingVal, 
  defaultRollingValColorClass, 
  icon: Icon, 
  highlight = false,
  rollingLabel = 'rolling',
  monthlyData = [],
  getConsistencyColor,
  formatCurrency,
  user,
  isPublishing,
  handlePublishMetrics,
}: { 
  label: string; 
  metricKey: 'pnl' | 'overall' | 'stockPnL' | 'intraday' | 'indexPnL' | 'overnight';
  isPnL: boolean;
  defaultCurrentVal: string; 
  defaultCurrentValColorClass?: string; 
  defaultRollingVal: string; 
  defaultRollingValColorClass?: string; 
  icon: any; 
  highlight?: boolean;
  rollingLabel?: string;
  monthlyData?: any[];
  getConsistencyColor: (percent: number) => string;
  formatCurrency: (val: number) => string;
  user?: User | null;
  isPublishing: Record<string, boolean>;
  handlePublishMetrics: (monthData: any, silent?: boolean) => Promise<void>;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftDropdown, setShowLeftDropdown] = useState(false);
  
  // Display values are always the default current month & rolling values (as per "only need to see" and not change)
  const displayLeftVal = defaultCurrentVal;
  const displayLeftColor = defaultCurrentValColorClass;
  const displayLeftLabel = "current month";

  const displayRightVal = defaultRollingVal;
  const displayRightColor = defaultRollingValColorClass;
  const displayRightLabel = rollingLabel;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowLeftDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isAnyPublishing = Object.values(isPublishing).some(Boolean);

  const handleToggleLeftDropdown = () => {
    setShowLeftDropdown(!showLeftDropdown);
  };

  return (
    <div ref={containerRef} className={`bg-slate-900 border ${highlight ? 'border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.1)]' : 'border-slate-800'} p-5 rounded-2xl shadow-xl hover:border-slate-700 transition-all group relative`}>
      <div className="flex items-center space-x-2 mb-4">
          <div className={`p-1.5 rounded-lg ${highlight ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-800 text-slate-500'}`}><Icon size={14} /></div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{label}</p>
      </div>
      
      <div className="flex justify-between items-baseline w-full relative">
        {/* Left Side */}
        <div className="relative">
          <p className={`text-2xl font-mono font-black tracking-tighter leading-none ${displayLeftColor || 'text-slate-200'}`}>
            {displayLeftVal}
          </p>
          <div className="flex items-center mt-1.5 space-x-1.5">
            <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider leading-none">
              {displayLeftLabel}
            </span>
            <button
              onClick={handleToggleLeftDropdown}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-400 border border-slate-700/50 transition-colors cursor-pointer flex items-center justify-center active:scale-95 shadow-md"
              title="View previous months ratios"
            >
              <ChevronsUpDown size={16} className="text-yellow-500 hover:text-yellow-400 animate-pulse" />
            </button>
          </div>

          {/* Left Dropdown */}
          {showLeftDropdown && (
            <div className="absolute left-0 top-full mt-2 z-50 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-150 space-y-1">
              <p className="text-[7.5px] text-slate-500 font-black uppercase tracking-widest px-2 py-1 border-b border-slate-800/60 mb-1">Monthly Breakdown</p>
              
              {monthlyData.map((m) => {
                const rawVal = m[metricKey];
                const textVal = isPnL 
                  ? `${rawVal >= 0 ? '+' : ''}${formatCurrency(rawVal)}`
                  : `${rawVal.toFixed(1)}%`;
                const textCol = isPnL 
                  ? (rawVal >= 0 ? 'text-emerald-400' : 'text-rose-400')
                  : getConsistencyColor(rawVal);

                return (
                  <div key={m.monthKey} className="flex flex-col items-start p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors w-full">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{m.label}</span>
                    <span className={`text-[10px] font-mono font-black ${textCol}`}>{textVal}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="text-right">
          <p className={`text-2xl font-mono font-black tracking-tighter leading-none ${displayRightColor || 'text-slate-300'}`}>
            {displayRightVal}
          </p>
          <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider mt-1.5">
            {displayRightLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
