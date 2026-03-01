

export enum TradeStatus {
  ACTIVE = 'ACTIVE',
  PARTIAL = 'PARTIAL BOOKED',
  EXITED = 'EXITED',
  STOPPED = 'STOP LOSS HIT',
  ALL_TARGET = 'ALL TARGET DONE'
}

export enum InstrumentType {
  INDEX = 'INDEX',
  STOCK = 'STOCK'
}

export enum OptionType {
  CE = 'CE',
  PE = 'PE',
  FUT = 'FUT'
}

export interface TradeSignal {
  id: string;
  date?: string; // Format: YYYY-MM-DD
  instrument: string;
  symbol: string;
  type: OptionType;
  action: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  targetsHit?: number; 
  trailingSL?: number | null;
  status: TradeStatus;
  timestamp: string;
  lastTradedTimestamp?: string;
  pnlPoints?: number;
  pnlRupees?: number;
  comment?: string;
  quantity?: number;
  cmp?: number;
  isBTST?: boolean;
  sheetIndex?: number;
}

export interface BrokerRiskSettings {
  capital: number;
  maxLossPerTrade: number;
  maxProfitPerTrade: number;
  dailyLossLimit: number;
  dailyTargetLimit: number;
  calculatedLots: number;
}

export interface ExecutedOrder {
  id: string;
  signalId: string;
  symbol: string;
  action: string;
  lots: number;
  pnl: number;
  timestamp: string;
}

export interface BrokerConfig {
  provider: 'ZEBU' | 'ANGELONE' | 'DHAN' | 'ZERODHA' | 'NONE';
  clientId: string;
  apiKey: string;
  apiSecret: string;
  totpSecret?: string;
  isLive: boolean;
  risk: BrokerRiskSettings;
  sessionTrades: ExecutedOrder[];
}

export interface OrderStatus {
  id: string;
  signalId: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  message?: string;
  timestamp: string;
}

export interface InsightData {
  type: 'TREND' | 'DOMINANCE' | 'FLOW';
  symbol: string;
  viewOrigin?: number;
  // Added protection property to fix TS error in MarketInsights.tsx
  protection?: number;
  cmp?: number;
  date?: string;
  sentiment?: 'Bullish' | 'Bearish';
  strength?: number;
  category?: 'Scalp' | 'Intraday' | 'Short-term' | 'Long-term';
  trend?: 'Bullish' | 'Bearish';
  pattern?: 'Narrow' | 'Range';
  phase?: 'Accumulation' | 'Distribution';
  isDead?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAdminReply: boolean;
  broadcaster?: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  expiryDate: string;
  isAdmin: boolean;
  canAccessAllBrokers?: boolean;
  password?: string;
  lastPassword?: string; 
  deviceId?: string | null;
}

export interface LogEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'SECURITY' | 'TRADE' | 'USER' | 'SYSTEM';
}

export interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  isPositive: boolean;
  lastUpdated: string;
}

export interface MonthlyRealization {
  month: string;
  realization: number;
}

export interface PnLStats {
  totalTrades: number;
  winRate: number;
  netPoints: number;
  estimatedPnL: number;
  accuracy: number;
}
