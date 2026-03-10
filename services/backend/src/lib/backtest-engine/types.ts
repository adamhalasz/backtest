import type { MarketAssetClass, MarketDataProviderId } from '../market-data-types';

export enum EntryFrequency {
  SCALPING = 'scalping',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export interface Candle {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryTime: Date;
  exitPrice: number;
  exitTime: Date;
  profit: number;
  signals: Record<string, unknown>;
  reason?: string;
}

export interface BacktestMetrics {
  winRate: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  profitFactor: number;
}

export interface BacktestRunResult {
  finalBalance: number;
  trades: Trade[];
  metrics: BacktestMetrics;
}

export interface StrategySignal {
  type: 'BUY' | 'SELL' | null;
  reason?: string;
}

export interface StrategyDefinition {
  name: string;
  defaultFrequency: EntryFrequency;
  minCandles: number;
  defaultConfig: {
    takeProfitLevel: number;
    stopLossLevel: number;
    timeframe?: string;
  };
  calculateSignal(candles: Candle[], index: number): StrategySignal;
}

export interface BacktestExecutionConfig {
  symbol: string;
  exchange: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  timeframe: string;
  entryFrequency: EntryFrequency;
  assetClass: MarketAssetClass;
  provider: MarketDataProviderId;
  riskPerTrade: number;
  maxTradeTime: number;
  takeProfitLevel?: number;
  stopLossLevel?: number;
}