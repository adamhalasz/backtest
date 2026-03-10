import type { MarketAssetClass, MarketDataProviderId } from '@/lib/market';

export enum EntryFrequency {
  SCALPING = 'scalping',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export interface Trade {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryTime: Date;
  exitPrice: number;
  exitTime: Date;
  profit: number;
  signals: {
    rsi?: { value: number; threshold: number };
    macd?: { value: number; signal: number };
    volatility?: number;
    session?: { hour: number; market: string };
    position?: {
      size: number;
      risk: number;
      takeProfitLevel?: number;
      stopLossLevel?: number;
    };
  };
  reason?: string;
}

export interface BacktestResult {
  finalBalance: number;
  trades: Trade[];
  metrics: {
    winRate: number;
    averageWin: number;
    averageLoss: number;
    maxDrawdown: number;
    profitFactor: number;
  };
}

export interface BacktestConfig {
  symbol: string;
  assetClass?: MarketAssetClass;
  provider?: MarketDataProviderId;
  exchange: string;
  strategy: string;
  timeframe: string;
  entryFrequency: EntryFrequency;
  startDate: string;
  endDate: string;
  initialBalance: number;
  takeProfitLevel?: number;
  stopLossLevel?: number;
  riskPerTrade?: number;
  maxTradeTime?: number;
  cumulativeTrading?: boolean;
  rsiOverbought?: number;
  rsiOversold?: number;
  macdFastPeriod?: number;
  macdSlowPeriod?: number;
  macdSignalPeriod?: number;
  bollingerPeriod?: number;
  bollingerDeviation?: number;
  emaPeriod?: number;
  vwapPeriod?: number;
  atrPeriod?: number;
  atrMultiplier?: number;
  onProgress?: (progress: number) => void;
}

export interface Candle {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StoredBacktest {
  id: string;
  created_at: string;
  updated_at?: string;
  symbol: string;
  exchange: string;
  strategy: string;
  start_date: string;
  end_date: string;
  initial_balance: number;
  final_balance: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  workflow_instance_id?: string | null;
  error_message?: string | null;
  parameters: {
    takeProfitLevel: number;
    stopLossLevel: number;
    assetClass?: MarketAssetClass;
    provider?: MarketDataProviderId;
    timeframe?: string;
    entryFrequency?: EntryFrequency;
    riskPerTrade?: number;
    maxTradeTime?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
    macdFastPeriod?: number;
    macdSlowPeriod?: number;
    macdSignalPeriod?: number;
    bollingerPeriod?: number;
    bollingerDeviation?: number;
    emaPeriod?: number;
    vwapPeriod?: number;
    atrPeriod?: number;
    atrMultiplier?: number;
  };
}

export enum Indicator {
  RSI = 'RSI',
  MACD = 'MACD',
  EMA = 'EMA',
  BOLLINGER = 'Bollinger Bands',
  ICHIMOKU = 'Ichimoku Cloud',
  VWAP = 'VWAP',
  PRICE_ACTION = 'Price Action',
  VOLUME = 'Volume Analysis',
  ATR = 'Average True Range',
  STOCHASTIC = 'Stochastic Oscillator',
  SUPPORT_RESISTANCE = 'Support & Resistance',
  FIBONACCI = 'Fibonacci Levels'
}

export interface StrategyGuide {
  overview: string;
  entryRules: {
    buy: string[];
    sell: string[];
  };
  exitRules: {
    takeProfit: string[];
    stopLoss: string[];
  };
  bestTimeframes: string[];
  marketConditions: {
    favorable: string[];
    unfavorable: string[];
  };
  riskManagement: {
    positionSizing: string;
    maxRiskPerTrade: string;
    recommendedLeverage?: string;
  };
  commonMistakes: string[];
  tips: string[];
}

export interface Bot {
  id: string;
  name: string;
  strategy: string;
  symbol: string;
  exchange: string;
  status: 'active' | 'paused' | 'stopped';
  parameters: {
    entryFrequency: EntryFrequency;
    timeframe: string;
    assetClass?: MarketAssetClass;
    provider?: MarketDataProviderId;
    takeProfitLevel: number;
    stopLossLevel: number;
    rsiOverbought: number;
    rsiOversold: number;
    macdFastPeriod?: number;
    macdSlowPeriod?: number;
    macdSignalPeriod?: number;
    bollingerPeriod?: number;
    bollingerDeviation?: number;
    emaPeriod?: number;
    vwapPeriod?: number;
    atrPeriod?: number;
    atrMultiplier?: number;
  };
  created_at: string;
  updated_at: string;
  last_trade_at: string | null;
  total_trades: number;
  win_rate: number;
  total_profit: number;
}

export interface StrategyFilter {
  indicators: Indicator[];
  minTakeProfit: number;
  maxTakeProfit: number;
  minStopLoss: number;
  maxStopLoss: number;
  timeframe?: string | 'all';
  frequency: EntryFrequency | 'all';
}