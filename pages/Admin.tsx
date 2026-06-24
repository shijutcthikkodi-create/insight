
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TradeSignal, TradeStatus, User, LogEntry, ChatMessage, WatchlistItem } from '../types';
import { 
  Zap, Loader2, Power, Briefcase, Activity, Moon, ShieldCheck, 
  RefreshCw, MessageSquareCode, Send, Users, ShieldAlert, Clock,
  Search, Edit3, Check, X, Calendar, Key, Shield, RotateCcw, Smartphone,
  Edit, UserCircle, Eye, EyeOff, Trophy
} from 'lucide-react';
import { updateSheetData } from '../services/googleSheetsService';
import { getWhatsAppConfig, saveWhatsAppConfig, formatSignalMessage, dispatchWhatsAppMessage, WhatsAppConfig, copySignalCardToClipboard } from '../services/whatsappService';

interface AdminProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (list: WatchlistItem[]) => void;
  signals: TradeSignal[];
  onUpdateSignals: (list: TradeSignal[]) => void;
  users: User[];
  onUpdateUsers: (list: User[]) => void;
  logs?: LogEntry[];
  messages: ChatMessage[];
  onNavigate: (page: string) => void;
  onHardSync?: () => Promise<void>;
}

const Admin: React.FC<AdminProps> = ({ signals = [], messages = [], users = [], logs = [], onHardSync }) => {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'BROADCAST' | 'USERS' | 'LOGS' | 'WHATSAPP'>('SIGNALS');

  // Refs for auto focus navigation on Enter press
  const instrumentRef = useRef<HTMLSelectElement>(null);
  const customStockNameRef = useRef<HTMLInputElement>(null);
  const symbolRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const entryPriceRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleInstrumentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sigInstrument === 'STOCKS') {
        customStockNameRef.current?.focus();
      } else {
        symbolRef.current?.focus();
      }
    }
  };

  const handleCustomStockNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      symbolRef.current?.focus();
    }
  };

  const handleSymbolKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      typeRef.current?.focus();
    }
  };

  const handleTypeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      entryPriceRef.current?.focus();
    }
  };

  const handleEntryPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      qtyRef.current?.focus();
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitRef.current?.focus();
    }
  };
  const [isSaving, setIsSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Manual CMP editing states
  const [editedCmpValues, setEditedCmpValues] = useState<Record<string, string>>({});
  const [savingCmpId, setSavingCmpId] = useState<string | null>(null);

  // Manual field editing states
  const [editedEntryValues, setEditedEntryValues] = useState<Record<string, string>>({});
  const [editedSlValues, setEditedSlValues] = useState<Record<string, string>>({});
  const [editedTslValues, setEditedTslValues] = useState<Record<string, string>>({});
  const [savingFieldStates, setSavingFieldStates] = useState<Record<string, string>>({}); // { "[id]-[fieldName]": boolean }

  // Search/Filter states
  const [userSearch, setUserSearch] = useState('');
  const [showOnlyPaperTraders, setShowOnlyPaperTraders] = useState(false);

  // Editing state for users
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});

  // Minimalist New Signal Form State
  const [sigInstrument, setSigInstrument] = useState('NIFTY');
  const [customStockName, setCustomStockName] = useState('');
  const [sigSymbol, setSigSymbol] = useState('');
  const [sigType, setSigType] = useState('CE'); 
  const [sigAction, setSigAction] = useState<'BUY' | 'SELL'>('BUY');
  const [sigEntry, setSigEntry] = useState('');
  const [sigIsBtst, setSigIsBtst] = useState(false);
  const [sigQty, setSigQty] = useState('');

  // Intel/Broadcast State
  const [intelText, setIntelText] = useState('');
  const [broadcasterName, setBroadcasterName] = useState(() => {
    return localStorage.getItem('libra_broadcaster_name') || 'Shiju Prasannan TC';
  });
  const [showBroadcasterName, setShowBroadcasterName] = useState(() => {
    return localStorage.getItem('libra_show_broadcaster') !== 'false';
  });

  // WhatsApp Gateway Integration States
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(() => getWhatsAppConfig());
  const [customBriefText, setCustomBriefText] = useState('');
  const [waDispatchTargetPhone, setWaDispatchTargetPhone] = useState('');
  const [isWaDispatching, setIsWaDispatching] = useState(false);

  useEffect(() => {
    localStorage.setItem('libra_broadcaster_name', broadcasterName);
    localStorage.setItem('libra_show_broadcaster', String(showBroadcasterName));
  }, [broadcasterName, showBroadcasterName]);

  const paperStats = useMemo<Record<string, { totalDeployments: number; lastActive: string; completedTrades: number }>>(() => {
    const stats: Record<string, { totalDeployments: number; lastActive: string; completedTrades: number }> = {};
    
    (logs || []).forEach(log => {
      if (log.type === 'TRADE' && log.action && log.action.startsWith('PAPER_TRADE_')) {
        const userName = log.user;
        if (!stats[userName]) {
          stats[userName] = {
            totalDeployments: 0,
            lastActive: log.timestamp,
            completedTrades: 0
          };
        }
        
        if (log.action === 'PAPER_TRADE_OPEN') {
          stats[userName].totalDeployments += 1;
        } else if (log.action.includes('CLOSE') || log.action.includes('TARGET') || log.action.includes('SL')) {
          stats[userName].completedTrades += 1;
        }
        
        if (new Date(log.timestamp).getTime() > new Date(stats[userName].lastActive).getTime()) {
          stats[userName].lastActive = log.timestamp;
        }
      }
    });
    
    return stats;
  }, [logs]);

  const activeSignals = useMemo(() => {
    return (signals || []).filter(s => s.status === TradeStatus.ACTIVE || s.status === TradeStatus.PARTIAL);
  }, [signals]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (showOnlyPaperTraders) {
      list = list.filter(u => !!paperStats[u.name]);
    }
    if (userSearch) {
      const s = userSearch.toLowerCase();
      list = list.filter(u => 
        u.name.toLowerCase().includes(s) || 
        u.phoneNumber.includes(s)
      );
    }
    return list;
  }, [users, userSearch, showOnlyPaperTraders, paperStats]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  const getExpiryStatus = (expiryStr: string) => {
    if (!expiryStr || expiryStr.toUpperCase() === 'PERPETUAL' || expiryStr.toUpperCase() === 'ADMIN') return 'SAFE';
    try {
      let dStr = expiryStr;
      const parts = expiryStr.split(/[-/]/);
      if (parts.length === 3 && parts[0].length === 2) dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      const expiry = new Date(dStr);
      expiry.setHours(23, 59, 59, 999);
      const now = new Date();
      if (isNaN(expiry.getTime())) return 'SAFE';
      if (expiry < now) return 'EXPIRED';
      const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 5) return 'SOON';
      return 'SAFE';
    } catch (e) { return 'SAFE'; }
  };

  const [isCopyingPhoto, setIsCopyingPhoto] = useState<string | null>(null);

  const handleManualSignalCardPhotoCopy = async (signal: TradeSignal) => {
    setIsCopyingPhoto(signal.id);
    const conf = getWhatsAppConfig();
    try {
      const headingText = signal.status === TradeStatus.ALL_TARGET ? "ALL TARGET DONE" : "TARGET ACHIEVED";
      const success = await copySignalCardToClipboard(signal, headingText);
      if (success === 'shared') {
        // Native share handled the flow nicely!
        window.open(conf.groupLink, '_blank');
      } else if (success === 'downloaded') {
        alert(`📥 PREMIUM PHOTO-CARD DOWNLOADED!\n\nThe trade graphic card has been saved to your device. You can now select and upload this image in your WhatsApp group.\n\nNow opening your WhatsApp Group...`);
        window.open(conf.groupLink, '_blank');
      } else if (success) {
        alert(`✨ PREMIUM PHOTO-CARD COPIED SUCCESSFULLY!\n\n1. It is now saved in your clipboard.\n2. Tap paste (Ctrl+V) to share it directly inside your WhatsApp chat.\n\nNow opening your WhatsApp Group...`);
        window.open(conf.groupLink, '_blank');
      } else {
        alert(`⚠️ Automatic image copying is restricted on this browser environment.\n\nFallback URL to invite link is: ${conf.groupLink}`);
        window.open(conf.groupLink, '_blank');
      }
    } catch (err) {
      console.error(err);
      alert(`⚠️ Failed to copy. Group Invitation Link: ${conf.groupLink}`);
    } finally {
      setIsCopyingPhoto(null);
    }
  };

  const handleManualSignalWhatsAppDispatch = async (signal: TradeSignal) => {
    const formatted = formatSignalMessage(signal, true);
    const conf = getWhatsAppConfig();
    setIsWaDispatching(true);

    if (conf.gatewayType === 'DIRECT') {
      try {
        await navigator.clipboard.writeText(formatted);
        alert("Trade details successfully copied to clipboard!\nRedirecting you to the WhatsApp Group...");
        window.open(conf.groupLink, '_blank');
      } catch (err) {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(formatted)}`, '_blank');
      }
    } else {
      const res = await dispatchWhatsAppMessage(formatted);
      if (res.success) {
        alert("🟢 Automatically dispatched signal to group via Gateway!");
      } else {
        alert("🔴 Automated Gateway dispatch failed: " + res.error);
      }
    }
    setIsWaDispatching(false);
  };

  const handleAddSignal = async () => {
    if (!sigSymbol || !sigEntry) return;
    setIsSaving(true);
    
    const finalInstrument = (sigInstrument === 'STOCKS' && customStockName.trim()) 
      ? customStockName.trim().toUpperCase() 
      : sigInstrument;

    const newSignal: any = {
        id: `SIG-${Date.now()}`,
        instrument: finalInstrument,
        symbol: sigSymbol,
        type: sigType,
        action: sigAction,
        entryPrice: parseFloat(sigEntry),
        quantity: sigQty ? parseInt(sigQty) : "",
        isBTST: sigIsBtst,
        timestamp: new Date().toISOString()
    };

    const success = await updateSheetData('signals', 'ADD', newSignal);
    
    if (success) {
      // Automatically send trade signal to WhatsApp group & registered numbers - "in no time"
      const alertMsg = formatSignalMessage(newSignal, true);
      const conf = getWhatsAppConfig();

      if (conf.gatewayType !== 'DIRECT') {
        try {
          // 1. Send automatically to primary group / callmebot
          await dispatchWhatsAppMessage(alertMsg);

          // 2. Send automatically to all registered mobile numbers directly
          const subscribers = users.filter(u => u.phoneNumber && u.phoneNumber.trim().length > 6);
          for (const sub of subscribers) {
            await dispatchWhatsAppMessage(alertMsg, sub.phoneNumber);
          }
        } catch (err) {
          console.error("Auto WhatsApp dispatch failed on creation:", err);
        }
      } else {
        // Direct flow: Copy to clipboard and open group redirect
        try {
          await navigator.clipboard.writeText(alertMsg);
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(alertMsg)}`, '_blank');
        } catch (e) {
          window.open(conf.groupLink, '_blank');
        }
      }

      setSigSymbol(''); setSigEntry(''); setSigQty(''); setSigIsBtst(false); setCustomStockName('');
      if (onHardSync) await onHardSync();
    }
    setIsSaving(false);
  };

  const handleUrgentExit = async (signal: TradeSignal) => {
    if (!window.confirm(`Confirm URGENT EXIT for ${signal.instrument} ${signal.symbol}?`)) return;
    setSavingId(signal.id);
    setIsSaving(true);
    
    const payload = { 
      id: signal.id,
      instrument: signal.instrument,
      symbol: signal.symbol,
      "exit input": "EXIT", 
      lastTradedTimestamp: new Date().toISOString(),
      sheetIndex: (signal as any).sheetIndex
    };
    
    const success = await updateSheetData('signals', 'UPDATE_SIGNAL', payload, signal.id);
    
    if (success && onHardSync) {
      setTimeout(async () => {
        await onHardSync();
        setSavingId(null);
        setIsSaving(false);
      }, 1500);
    } else {
      setSavingId(null);
      setIsSaving(false);
    }
  };

  const handleUpdateCmp = async (signal: TradeSignal, cmpVal: string) => {
    if (!cmpVal || isNaN(parseFloat(cmpVal))) {
      alert("Please enter a valid numeric Current Market Price (CMP).");
      return;
    }
    setSavingCmpId(signal.id);
    const numericCmp = parseFloat(cmpVal);
    
    const payload = { 
      id: signal.id,
      instrument: signal.instrument,
      symbol: signal.symbol,
      cmp: numericCmp,
      CMP: numericCmp,
      lastTradedTimestamp: new Date().toISOString(),
      sheetIndex: (signal as any).sheetIndex
    };
    
    const success = await updateSheetData('signals', 'UPDATE_SIGNAL', payload, signal.id);
    
    if (success) {
      if (onHardSync) {
        await onHardSync();
      }
      alert(`🟢 CMP successfully updated to ₹${numericCmp} for ${signal.instrument} ${signal.symbol}!`);
    } else {
      alert("🔴 Failed to update CMP. Please try again.");
    }
    setSavingCmpId(null);
  };

  const handleUpdateSignalField = async (
    signal: TradeSignal,
    fieldName: 'entryPrice' | 'SL_MANU' | 'manualTSL',
    valueStr: string
  ) => {
    if (!valueStr || isNaN(parseFloat(valueStr))) {
      alert(`Please enter a valid numeric value.`);
      return;
    }
    
    const key = `${signal.id}-${fieldName}`;
    setSavingFieldStates(prev => ({ ...prev, [key]: true }));
    const numericValue = parseFloat(valueStr);
    
    const payload: any = {
      id: signal.id,
      instrument: signal.instrument,
      symbol: signal.symbol,
      lastTradedTimestamp: new Date().toISOString(),
      sheetIndex: (signal as any).sheetIndex
    };

    if (fieldName === 'entryPrice') {
      payload.entryPrice = numericValue;
      payload.EntryPrice = numericValue;
    } else if (fieldName === 'SL_MANU') {
      payload['SL MANU'] = numericValue;
      payload.SL_MANU = numericValue;
    } else if (fieldName === 'manualTSL') {
      payload.manualTSL = numericValue;
      payload.trailingSL = numericValue;
      payload.manual_tsl = numericValue;
    }

    const success = await updateSheetData('signals', 'UPDATE_SIGNAL', payload, signal.id);
    
    if (success) {
      if (onHardSync) {
        await onHardSync();
      }
      alert(`🟢 '${fieldName === 'entryPrice' ? 'BASE LEVEL' : fieldName === 'SL_MANU' ? 'INVALIDATION POINT' : 'PROTECTION'}' successfully updated to ${numericValue} for ${signal.instrument} ${signal.symbol}!`);
    } else {
      alert(`🔴 Failed to update field. Please try again.`);
    }
    
    setSavingFieldStates(prev => ({ ...prev, [key]: false }));
  };

  const handlePostIntel = async () => {
    if (!intelText.trim()) return;
    setIsSaving(true);
    const success = await updateSheetData('messages', 'ADD', {
      id: `msg-${Date.now()}`,
      text: intelText.trim(),
      timestamp: new Date().toISOString(),
      isAdminReply: true,
      userId: 'ADMIN',
      broadcaster: showBroadcasterName ? broadcasterName.trim() : ''
    });
    if (success) {
      setIntelText('');
      if (onHardSync) await onHardSync();
    }
    setIsSaving(false);
  };

  const startEditingUser = (u: User) => {
    setEditingUserId(u.id);
    setEditUserForm({ ...u });
  };

  const cancelEditingUser = () => {
    setEditingUserId(null);
    setEditUserForm({});
  };

  const saveUserUpdate = async (userId: string) => {
    setIsSaving(true);
    setSavingId(userId);
    
    const payload = {
      id: userId,
      name: editUserForm.name,
      phoneNumber: editUserForm.phoneNumber,
      expiryDate: editUserForm.expiryDate,
      isAdmin: editUserForm.isAdmin,
      password: editUserForm.password
    };

    const success = await updateSheetData('users', 'UPDATE_USER', payload, userId);
    
    if (success) {
      setEditingUserId(null);
      if (onHardSync) await onHardSync();
    }
    setSavingId(null);
    setIsSaving(false);
  };

  const handleResetHWID = async (user: User) => {
    if (!window.confirm(`RESET device lock for ${user.name}? This will allow login from any new device.`)) return;
    setIsSaving(true);
    setSavingId(user.id);
    
    const payload = {
        id: user.id,
        deviceId: "" 
    };
    
    const success = await updateSheetData('users', 'UPDATE_USER', payload, user.id);
    
    if (success && onHardSync) {
      await onHardSync();
    }
    setSavingId(null);
    setIsSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 px-2 sm:px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Terminal Command</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Superuser Administrative Access</p>
          </div>
          <button onClick={onHardSync} className="flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-widest hover:bg-slate-800 transition-colors">
              <RefreshCw size={14} className={isSaving ? 'animate-spin' : ''} />
              <span>Force Global Sync</span>
          </button>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-2xl overflow-x-auto no-scrollbar">
            {[
                { id: 'SIGNALS', icon: Zap, label: 'Execution' },
                { id: 'BROADCAST', icon: MessageSquareCode, label: 'Alpha' },
                { id: 'USERS', icon: Users, label: 'Subscribers' },
                { id: 'WHATSAPP', icon: Smartphone, label: 'WhatsApp Hub' },
                { id: 'LOGS', icon: ShieldAlert, label: 'Audit' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setEditingUserId(null); }}
                    className={`flex items-center px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <tab.icon size={14} className="mr-2" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {activeTab === 'SIGNALS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-2">
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex items-center">
                        <Zap size={18} className="mr-3 text-blue-500" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">New Execution Order</h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Instrument</label>
                                <select ref={instrumentRef} onKeyDown={handleInstrumentKeyDown} value={sigInstrument} onChange={e => { setSigInstrument(e.target.value); if (e.target.value !== 'STOCKS') setCustomStockName(''); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-bold">
                                    <option value="NIFTY">NIFTY</option>
                                    <option value="BANKNIFTY">BANKNIFTY</option>
                                    <option value="FINNIFTY">FINNIFTY</option>
                                    <option value="MIDCPNIFTY">MIDCPNIFTY</option>
                                    <option value="SENSEX">SENSEX</option>
                                    <option value="STOCKS">STOCKS (MANUAL)</option>
                                </select>
                                {sigInstrument === 'STOCKS' && (
                                  <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <label className="block text-[8px] font-black text-blue-500 mb-1 uppercase tracking-widest flex items-center">
                                      <Edit size={10} className="mr-1" /> Custom Stock Name
                                    </label>
                                    <input 
                                      ref={customStockNameRef}
                                      onKeyDown={handleCustomStockNameKeyDown}
                                      type="text" 
                                      value={customStockName} 
                                      onChange={e => setCustomStockName(e.target.value)} 
                                      placeholder="e.g. RELIANCE" 
                                      className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-black tracking-widest" 
                                    />
                                  </div>
                                )}
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Symbol</label>
                                <input ref={symbolRef} onKeyDown={handleSymbolKeyDown} type="text" value={sigSymbol} onChange={e => setSigSymbol(e.target.value)} placeholder="e.g. 24500" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-mono font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Type (e.g. CE JAN 27)</label>
                                <input ref={typeRef} onKeyDown={handleTypeKeyDown} type="text" value={sigType} onChange={e => setSigType(e.target.value)} placeholder="CE / PE / FUT" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-mono font-bold" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Action</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setSigAction('BUY')} className={`py-3 text-[10px] font-black rounded-xl border transition-all ${sigAction === 'BUY' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>BUY</button>
                                    <button onClick={() => setSigAction('SELL')} className={`py-3 text-[10px] font-black rounded-xl border transition-all ${sigAction === 'SELL' ? 'bg-rose-600 border-rose-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>SELL</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Entry Price</label>
                                <input ref={entryPriceRef} onKeyDown={handleEntryPriceKeyDown} type="number" value={sigEntry} onChange={e => setSigEntry(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-mono font-bold" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Quantity</label>
                                <input ref={qtyRef} onKeyDown={handleQtyKeyDown} type="number" value={sigQty} onChange={e => setSigQty(e.target.value)} placeholder="Size" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-mono font-bold" />
                            </div>
                        </div>
                        <button onClick={() => setSigIsBtst(!sigIsBtst)} className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center space-x-2 ${sigIsBtst ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                            <Moon size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">BTST Toggle</span>
                        </button>
                        <button ref={submitRef} onClick={handleAddSignal} disabled={isSaving || !sigSymbol || !sigEntry || (sigInstrument === 'STOCKS' && !customStockName.trim())} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl text-[11px] font-black transition-all shadow-xl shadow-blue-900/40 uppercase tracking-[0.2em] flex items-center justify-center">
                            {isSaving ? <Loader2 size={16} className="animate-spin mr-3" /> : <ShieldCheck size={16} className="mr-3" />} Broadcast Signal
                        </button>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center px-1">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                        <Activity size={14} className="mr-2 text-emerald-500" /> Active Terminal Risk ({activeSignals.length})
                    </h3>
                </div>
                {activeSignals.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] italic">Zero active risk</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {activeSignals.map(s => (
                            <div key={s.id} className={`bg-slate-900 border ${savingId === s.id ? 'border-blue-500' : 'border-slate-800'} p-5 rounded-3xl shadow-xl flex flex-col gap-5 transition-all`}>
                                {/* Header: Instrument name + Metadata */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                                    <div className="flex items-center space-x-3.5 min-w-0">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${s.action === 'BUY' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-900/20 border-rose-500/30 text-rose-400'}`}>
                                            <Briefcase size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-white font-mono leading-none uppercase truncate">{s.instrument} {s.symbol} {s.type}</h4>
                                            <div className="flex items-center space-x-2 mt-1.5">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${s.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                    {s.action}
                                                </span>
                                                {s.isBTST && (
                                                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center">
                                                        <Moon size={10} className="mr-1" /> OVERNIGHT
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 shrink-0">
                                        <span className="text-[9px] font-black text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                                            QTY: {s.quantity || '1'}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800/80 uppercase">
                                            {s.status}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Parameter Update Dashboard - Takes full width of the card */}
                                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5 w-full">
                                    {/* 1. CMP */}
                                    <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3.5 py-2.5 justify-between">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider leading-none">CMP</span>
                                            <input 
                                                type="number"
                                                step="any"
                                                value={editedCmpValues[s.id] ?? (s.cmp != null ? String(s.cmp) : '')}
                                                onChange={e => setEditedCmpValues({ ...editedCmpValues, [s.id]: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-transparent border-none text-xs text-slate-200 focus:outline-none font-bold font-mono placeholder:text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mt-1"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleUpdateCmp(s, editedCmpValues[s.id] ?? (s.cmp != null ? String(s.cmp) : ''))}
                                            disabled={savingCmpId === s.id}
                                            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                                            title="Set CMP value on sheet"
                                        >
                                            {savingCmpId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                        </button>
                                    </div>

                                    {/* 2. BASE LEVEL (entryPrice) */}
                                    <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3.5 py-2.5 justify-between">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7.5px] font-black text-blue-400/80 uppercase tracking-wider leading-none">BASE LEVEL</span>
                                            <input 
                                                type="number"
                                                step="any"
                                                value={editedEntryValues[s.id] ?? (s.entryPrice != null ? String(s.entryPrice) : '')}
                                                onChange={e => setEditedEntryValues({ ...editedEntryValues, [s.id]: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-transparent border-none text-xs text-slate-200 focus:outline-none font-bold font-mono placeholder:text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mt-1"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleUpdateSignalField(s, 'entryPrice', editedEntryValues[s.id] ?? (s.entryPrice != null ? String(s.entryPrice) : ''))}
                                            disabled={savingFieldStates[`${s.id}-entryPrice`]}
                                            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                                            title="Set entryPrice parameter on sheet"
                                        >
                                            {savingFieldStates[`${s.id}-entryPrice`] ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                        </button>
                                    </div>

                                    {/* 3. INVALIDATION POINT (SL MANU) */}
                                    <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3.5 py-2.5 justify-between">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7.5px] font-black text-rose-400/80 uppercase tracking-wider leading-none">SL MANU</span>
                                            <input 
                                                type="number"
                                                step="any"
                                                value={editedSlValues[s.id] ?? (s.stopLoss != null ? String(s.stopLoss) : '')}
                                                onChange={e => setEditedSlValues({ ...editedSlValues, [s.id]: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-transparent border-none text-xs text-slate-200 focus:outline-none font-bold font-mono placeholder:text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mt-1"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleUpdateSignalField(s, 'SL_MANU', editedSlValues[s.id] ?? (s.stopLoss != null ? String(s.stopLoss) : ''))}
                                            disabled={savingFieldStates[`${s.id}-SL_MANU`]}
                                            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                                            title="Set stopLoss (SL MANU) parameter on sheet"
                                        >
                                            {savingFieldStates[`${s.id}-SL_MANU`] ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                        </button>
                                    </div>

                                    {/* 4. PROTECTION (manualTSL) */}
                                    <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3.5 py-2.5 justify-between">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7.5px] font-black text-amber-400/80 uppercase tracking-wider leading-none">manualTSL</span>
                                            <input 
                                                type="number"
                                                step="any"
                                                value={editedTslValues[s.id] ?? (s.trailingSL != null ? String(s.trailingSL) : '')}
                                                onChange={e => setEditedTslValues({ ...editedTslValues, [s.id]: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-transparent border-none text-xs text-slate-200 focus:outline-none font-bold font-mono placeholder:text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mt-1"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleUpdateSignalField(s, 'manualTSL', editedTslValues[s.id] ?? (s.trailingSL != null ? String(s.trailingSL) : ''))}
                                            disabled={savingFieldStates[`${s.id}-manualTSL`]}
                                            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                                            title="Set trailingSL (manualTSL) parameter on sheet"
                                        >
                                            {savingFieldStates[`${s.id}-manualTSL`] ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Footer Action Tray */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-800">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button 
                                            onClick={() => handleManualSignalCardPhotoCopy(s)}
                                            disabled={isCopyingPhoto === s.id}
                                            className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 border border-indigo-500/20"
                                            title="Copy digital trading card image to your clipboard"
                                        >
                                            {isCopyingPhoto === s.id ? <Loader2 size={11} className="animate-spin" /> : <Trophy size={11} />}
                                            <span>Copy Photo-Card 📸</span>
                                        </button>
                                        <button 
                                            onClick={() => handleManualSignalWhatsAppDispatch(s)}
                                            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                                            title="Dispatch current signal targets and metrics to WhatsApp"
                                        >
                                            <Send size={11} />
                                            <span>Dispatch WA</span>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleUrgentExit(s)} 
                                        disabled={isSaving} 
                                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xl shadow-rose-900/40 flex items-center justify-center space-x-1.5 active:scale-95 sm:ml-auto"
                                    >
                                        {savingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                                        <span>URGENT EXIT</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'BROADCAST' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-2">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                    <MessageSquareCode className="text-blue-500" size={24} />
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Broadcast Market Intel</h3>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Admin Broadcaster Name</label>
                                <button 
                                  onClick={() => setShowBroadcasterName(!showBroadcasterName)}
                                  className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg transition-colors ${showBroadcasterName ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 bg-slate-800'}`}
                                >
                                    {showBroadcasterName ? <Eye size={12} /> : <EyeOff size={12} />}
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{showBroadcasterName ? 'VISIBLE' : 'HIDDEN'}</span>
                                </button>
                            </div>
                            <div className={`relative group transition-opacity duration-300 ${showBroadcasterName ? 'opacity-100' : 'opacity-40'}`}>
                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                                <input 
                                    type="text" 
                                    value={broadcasterName} 
                                    onChange={e => setBroadcasterName(e.target.value)} 
                                    placeholder="e.g. Shiju Prasannan TC" 
                                    disabled={!showBroadcasterName}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none font-black tracking-widest disabled:cursor-not-allowed" 
                                />
                            </div>
                        </div>
                    </div>

                    <textarea 
                        value={intelText} 
                        onChange={e => setIntelText(e.target.value)} 
                        placeholder="Push global intel..." 
                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:border-blue-500 outline-none font-bold mb-4" 
                    />
                    
                    <button onClick={handlePostIntel} disabled={isSaving || !intelText.trim() || (showBroadcasterName && !broadcasterName.trim())} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center">
                        {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />} Push Intel
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                    <Users size={14} className="mr-2 text-blue-500" /> Institutional Subscriber List ({users.length})
                </h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                        onClick={() => setShowOnlyPaperTraders(!showOnlyPaperTraders)}
                        className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                            showOnlyPaperTraders 
                              ? 'bg-amber-600 border-amber-500/50 text-white shadow-lg shadow-amber-950/40' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                    >
                        <Briefcase size={11} className={showOnlyPaperTraders ? 'animate-pulse' : ''} />
                        <span>{showOnlyPaperTraders ? 'Showing Paper Traders' : 'Filter Paper Traders'}</span>
                    </button>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white focus:border-blue-500 outline-none font-bold placeholder:text-slate-700" />
                    </div>
                </div>
            </div>

            {/* Paper Trading Insights Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-slate-900 to-amber-950/10 border border-amber-500/20 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Active Paper Traders</p>
                            <h4 className="text-2xl font-black text-white mt-1">
                                {Object.keys(paperStats).length} <span className="text-[10px] font-bold text-slate-500 uppercase">Users</span>
                            </h4>
                        </div>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
                            <Activity size={20} className="animate-pulse" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-wider font-bold">Total registered user accounts with simulated trade logs.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl col-span-2">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3">Live Practice Activity Ledger</p>
                    <div className="max-h-[85px] overflow-y-auto pr-1 space-y-2 scrollbar-none">
                        {Object.keys(paperStats).length === 0 ? (
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic py-2">No simulated trades recorded yet.</p>
                        ) : (
                            (Object.entries(paperStats) as [string, { totalDeployments: number; lastActive: string; completedTrades: number }][])
                                .sort((a, b) => new Date(b[1].lastActive).getTime() - new Date(a[1].lastActive).getTime())
                                .map(([name, stat], idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                            <span className="font-bold text-slate-300 uppercase">{name}</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-slate-500">Deployments: <strong className="text-amber-500 font-black">{stat.totalDeployments}</strong></span>
                                            <span className="text-slate-500">Closed: <strong className="text-emerald-500 font-black">{stat.completedTrades}</strong></span>
                                            <span className="text-slate-600 font-mono text-[9px]">Last Active: {new Date(stat.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800">
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Subscriber Details</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Access Expiry</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Access Key</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Hardware Lock</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.map(u => {
                                const isEditing = editingUserId === u.id;
                                const status = getExpiryStatus(u.expiryDate);
                                const isSavingUser = savingId === u.id;

                                if (isEditing) {
                                    return (
                                        <tr key={u.id} className="bg-blue-600/5 transition-colors">
                                            <td className="px-6 py-4 space-y-2">
                                                <input type="text" value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-bold" placeholder="Full Name" />
                                                <input type="text" value={editUserForm.phoneNumber} onChange={e => setEditUserForm({...editUserForm, phoneNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono" placeholder="Phone Number" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" value={editUserForm.expiryDate} onChange={e => setEditUserForm({...editUserForm, expiryDate: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono" placeholder="DD-MM-YYYY" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-2">
                                                    <input type="text" value={editUserForm.password} onChange={e => setEditUserForm({...editUserForm, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono" placeholder="Access Key" />
                                                    <div className="flex items-center space-x-2">
                                                        <input type="checkbox" id={`edit-admin-${u.id}`} checked={editUserForm.isAdmin} onChange={e => setEditUserForm({...editUserForm, isAdmin: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-blue-600" />
                                                        <label htmlFor={`edit-admin-${u.id}`} className="text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">Admin Access</label>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button onClick={() => saveUserUpdate(u.id)} disabled={isSaving} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all active:scale-95">
                                                        {isSavingUser ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                    </button>
                                                    <button onClick={cancelEditingUser} disabled={isSaving} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={u.id} className={`hover:bg-slate-800/30 transition-colors ${status === 'EXPIRED' ? 'bg-rose-950/10' : status === 'SOON' ? 'bg-amber-950/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 font-black border border-slate-700">
                                                    {u.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-black text-white uppercase tracking-tight">{u.name}</span>
                                                        {u.isAdmin && <Shield size={10} className="text-purple-400" />}
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-[10px] font-bold font-mono text-slate-500">{u.phoneNumber}</span>
                                                        {paperStats[u.name] && (
                                                            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center">
                                                                <Briefcase size={8} className="mr-1 animate-pulse" /> SANDBOX ({paperStats[u.name].totalDeployments} TRADES)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-mono font-black ${status === 'EXPIRED' ? 'text-rose-500' : status === 'SOON' ? 'text-amber-500' : 'text-slate-300'}`}>
                                                    {u.expiryDate}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'EXPIRED' ? 'text-rose-600' : status === 'SOON' ? 'text-amber-600' : 'text-slate-600'}`}>
                                                    {status === 'EXPIRED' ? 'EXPIRED' : status === 'SOON' ? 'EXPIRING SOON' : 'ACTIVE'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <Key size={12} className="text-slate-700" />
                                                <span className="text-xs font-mono font-black text-slate-400 tracking-widest uppercase">{u.password || '----'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-between group/hwid">
                                                <div className="flex items-center space-x-2">
                                                    <Smartphone size={12} className={u.deviceId ? 'text-blue-500' : 'text-slate-700'} />
                                                    <span className={`text-[10px] font-mono font-bold uppercase truncate max-w-[100px] ${u.deviceId ? 'text-slate-300' : 'text-slate-700 italic'}`}>
                                                        {u.deviceId ? u.deviceId.substring(0, 10) + '...' : 'Unbound'}
                                                    </span>
                                                </div>
                                                {u.deviceId && (
                                                    <button 
                                                        onClick={() => handleResetHWID(u)}
                                                        disabled={isSaving}
                                                        className="p-1.5 bg-slate-800 text-slate-500 hover:text-amber-500 rounded-lg opacity-0 group-hover/hwid:opacity-100 transition-all border border-transparent hover:border-amber-500/20"
                                                        title="Reset Device Lock"
                                                    >
                                                        <RotateCcw size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => startEditingUser(u)} className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all active:scale-95" title="Edit Subscriber">
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-20 text-center bg-slate-900/20">
                        <Users size={40} className="mx-auto text-slate-800 mb-4 opacity-30" />
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] italic">No matching subscribers</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                    <ShieldAlert size={14} className="mr-2 text-rose-500" /> Terminal Audit Logs
                </h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl divide-y divide-slate-800">
                {sortedLogs.length === 0 ? (
                    <div className="p-10 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest italic">No archived events</div>
                ) : (
                    sortedLogs.map((log, idx) => (
                        <div key={idx} className="p-5 hover:bg-slate-800/20 transition-colors group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div className="flex items-center space-x-3">
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                        log.type === 'SECURITY' ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' :
                                        log.type === 'TRADE' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' :
                                        'bg-blue-900/20 border-blue-500/30 text-blue-400'
                                    }`}>
                                        {log.type}
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{log.user}</span>
                                </div>
                                <div className="flex items-center text-[9px] font-mono text-slate-600 font-bold uppercase">
                                    <Clock size={10} className="mr-1.5" /> {new Date(log.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{log.action}</span>
                                <p className="text-xs text-slate-400 font-medium italic">"{log.details}"</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}

      {activeTab === 'WHATSAPP' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Console */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex items-center">
                            <Smartphone size={18} className="mr-3 text-emerald-400" />
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">WhatsApp Router Config</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">WhatsApp Group Invitation Link</label>
                                <input 
                                    type="text" 
                                    value={waConfig.groupLink} 
                                    onChange={e => {
                                        const updated = { ...waConfig, groupLink: e.target.value };
                                        setWaConfig(updated);
                                        saveWhatsAppConfig(updated);
                                    }} 
                                    placeholder="https://chat.whatsapp.com/..." 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 outline-none font-mono font-medium" 
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Gateway Strategy</label>
                                <select 
                                    value={waConfig.gatewayType} 
                                    onChange={e => {
                                        const updated = { ...waConfig, gatewayType: e.target.value as any };
                                        setWaConfig(updated);
                                        saveWhatsAppConfig(updated);
                                    }} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 outline-none font-bold"
                                >
                                    <option value="DIRECT">💻 Deep-Link Redirection & Copy Clipboard (Manual)</option>
                                    <option value="CALLMEBOT">🤖 CallMeBot WhatsApp Automated API Gateway</option>
                                    <option value="CUSTOM_WEBHOOK">🔌 Custom Webhook HTTP POST JSON Endpoint</option>
                                </select>
                            </div>

                            {waConfig.gatewayType === 'CALLMEBOT' && (
                                <div className="space-y-4 pt-2 border-t border-slate-800/50">
                                    <p className="text-[10px] text-blue-400 leading-normal font-medium">
                                        💡 *CallMeBot is a free automated gateway that lets you push WhatsApp alerts instantly via a simple POST request. Request your API key by messaging "I allow callmebot to send me messages" to +34 644 63 48 index numbers.*
                                    </p>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">CallMeBot Phone Number (with Country Code)</label>
                                        <input 
                                            type="text" 
                                            value={waConfig.callmebotPhone} 
                                            onChange={e => {
                                                const updated = { ...waConfig, callmebotPhone: e.target.value };
                                                setWaConfig(updated);
                                                saveWhatsAppConfig(updated);
                                            }} 
                                            placeholder="+919539407707" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">CallMeBot API Key</label>
                                        <input 
                                            type="password" 
                                            value={waConfig.callmebotKey} 
                                            onChange={e => {
                                                const updated = { ...waConfig, callmebotKey: e.target.value };
                                                setWaConfig(updated);
                                                saveWhatsAppConfig(updated);
                                            }} 
                                            placeholder="e.g. 123456" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono" 
                                        />
                                    </div>
                                </div>
                            )}

                            {waConfig.gatewayType === 'CUSTOM_WEBHOOK' && (
                                <div className="space-y-3 pt-2 border-t border-slate-800/50">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">HTTP POST Webhook Endpoint URL</label>
                                        <input 
                                            type="text" 
                                            value={waConfig.webhookUrl} 
                                            onChange={e => {
                                                const updated = { ...waConfig, webhookUrl: e.target.value };
                                                setWaConfig(updated);
                                                saveWhatsAppConfig(updated);
                                            }} 
                                            placeholder="https://hooks.zapier.com/hooks/catch/..." 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 outline-none font-mono font-medium" 
                                        />
                                        <span className="text-[8px] text-slate-500 mt-1 block leading-normal uppercase">
                                            The system automatically sends a POST request with trade JSON details to this webhook "in no time" upon any alert.
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-3 pt-4 border-t border-slate-800">
                                <label className="relative flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={waConfig.autoDispatchNewLink} 
                                        onChange={e => {
                                            const updated = { ...waConfig, autoDispatchNewLink: e.target.checked };
                                            setWaConfig(updated);
                                            saveWhatsAppConfig(updated);
                                        }}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    <div className="ml-3 uppercase tracking-wider text-[10px] font-black text-slate-400">Trigger Alert Redirects Automatically</div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscriber List Direct Send desk */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center">
                                <Users size={16} className="mr-3 text-blue-400" /> Subscribers Direct Dispatch
                            </h3>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[8px] font-black">
                                total: {users.length}
                            </span>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">
                                Easily dispatch signals or custom messages straight to subscribers' mobile phone numbers below. 
                                Click <span className="text-emerald-400 font-bold">⚡ Send WA</span> to trigger dispatch via your chosen strategy.
                            </p>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                {users.filter(u => u.phoneNumber).map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl hover:border-slate-700/60 transition-all group">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 text-xs leading-none">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white leading-none uppercase">{u.name}</h4>
                                                <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">{u.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                const sampleMessage = signals.length > 0 
                                                  ? formatSignalMessage(signals[0], true)
                                                  : `📊 *ADMIN CORE PING* 📊\nHello ${u.name}! This is Shiju. Ensure your Libra Fin-Tech terminal is active so you receive trade signals in real-time.`;
                                                
                                                setIsWaDispatching(true);
                                                const res = await dispatchWhatsAppMessage(sampleMessage, u.phoneNumber);
                                                setIsWaDispatching(false);
                                                
                                                if (res.success) {
                                                   if (waConfig.gatewayType === 'DIRECT' && res.url) {
                                                     window.open(res.url, '_blank');
                                                   } else {
                                                     alert(`🟢 Messages dispatched successfully to subscriber ${u.name}!`);
                                                   }
                                                } else {
                                                   alert(`🔴 Send failed: ${res.error}`);
                                                }
                                            }}
                                            className="px-3 py-2 bg-slate-900 hover:bg-emerald-600 text-[9px] font-black uppercase text-emerald-400 hover:text-white border border-emerald-500/20 group-hover:border-emerald-500/50 rounded-xl transition-all flex items-center space-x-1.5"
                                        >
                                            <Send size={10} />
                                            <span>Send WA</span>
                                        </button>
                                    </div>
                                ))}
                                {users.filter(u => u.phoneNumber).length === 0 && (
                                    <div className="text-center py-10 bg-slate-950/30 border border-dashed border-slate-800/80 rounded-2xl">
                                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">No Subscriber Contacts Available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Message Drafting Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                    <MessageSquareCode className="text-blue-500" size={20} />
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Bulk Broadcast WhatsApp Assistant</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Compose Broadcast Message</label>
                        <textarea 
                            value={customBriefText} 
                            onChange={e => setCustomBriefText(e.target.value)}
                            placeholder="Draft your general market outlook, instructions or custom alerts here to send..." 
                            className="w-full h-44 bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-white focus:border-blue-500 outline-none font-medium leading-relaxed font-mono"
                        />
                        <div className="flex space-x-2 mt-2">
                            <button 
                                onClick={() => {
                                    if (signals.length > 0) {
                                      setCustomBriefText(formatSignalMessage(signals[0], true));
                                    } else {
                                      alert("No active trade signals to format.");
                                    }
                                }}
                                className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-[8px] font-black text-slate-400 uppercase rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                📋 Parse Latest Signal
                            </button>
                            <button 
                                onClick={() => {
                                    setCustomBriefText(`📊 *LIBRA MARKET PING* 📊\n====================\n🚀 Nifty is staging a significant breakout at this hour. Enter secure terminal details immediately to view potential options execution targets.\n\n🔐 Libra Solutions.`);
                                }}
                                className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-[8px] font-black text-slate-400 uppercase rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                ✍️ Base Template
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 h-44 overflow-y-auto no-scrollbar">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block mb-2 border-b border-slate-900 pb-1">💬 WYSIWYG Message Preview</span>
                            <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap font-medium leading-relaxed">{customBriefText || 'Type a message on the left to review the high-alert rendering layout.'}</pre>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <button 
                                onClick={async () => {
                                    if (!customBriefText.trim()) return alert("Message stream is blank!");
                                    setIsWaDispatching(true);
                                    const res = await dispatchWhatsAppMessage(customBriefText);
                                    setIsWaDispatching(false);
                                    
                                    if (res.success) {
                                        if (waConfig.gatewayType === 'DIRECT') {
                                            alert("Copied to clipboard! Launching WhatsApp Group channel now...");
                                            window.open(res.url, '_blank');
                                        } else {
                                            alert("🟢 Automated Group dispatch successfully delivered!");
                                        }
                                    } else {
                                        alert("🔴 Group Broadcast failed: " + res.error);
                                    }
                                }} 
                                disabled={isWaDispatching || !customBriefText.trim()}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2"
                            >
                                <Send size={12} />
                                <span>Send to Group link</span>
                            </button>

                            <button 
                                onClick={async () => {
                                    if (!customBriefText.trim()) return alert("Message stream is blank!");
                                    const subscribers = users.filter(u => u.phoneNumber && u.phoneNumber.trim().length > 6);
                                    if (subscribers.length === 0) return alert("No subscriber numbers enrolled!");
                                    
                                    if (!window.confirm(`Are you sure you want to broadcast this message to ALL ${subscribers.length} subscribers directly?`)) return;
                                    
                                    setIsWaDispatching(true);
                                    let sentCount = 0;
                                    for (const sub of subscribers) {
                                        const res = await dispatchWhatsAppMessage(customBriefText, sub.phoneNumber);
                                        if (res.success) {
                                            if (waConfig.gatewayType === 'DIRECT' && res.url) {
                                                window.open(res.url, '_blank');
                                            } else {
                                                sentCount++;
                                            }
                                        }
                                    }
                                    setIsWaDispatching(false);
                                    
                                    if (waConfig.gatewayType === 'DIRECT') {
                                        alert("Redirect links triggered. For bulk completely automated dispatch, switch your Gateway Strategy to CallMeBot or Custom Webhook!");
                                    } else {
                                        alert(`🟢 Automated Subscribers Direct Broadcast complete! Sent to ${sentCount} subscribers.`);
                                    }
                                }}
                                disabled={isWaDispatching || !customBriefText.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2"
                            >
                                <Smartphone size={12} />
                                <span>Send to Registered Contacts</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
