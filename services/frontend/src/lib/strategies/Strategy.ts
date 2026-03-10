import { Candle, Indicator, EntryFrequency, StrategyGuide } from '../types';

export interface StrategySignal {
  type: 'BUY' | 'SELL' | null;
  reason?: string;
}

export interface Strategy {
  name: string;
  description: string;
  defaultFrequency: EntryFrequency;
  guide: StrategyGuide;
  indicators: Indicator[];
  calculateSignal(candles: Candle[], index: number): StrategySignal;
  getDefaultConfig(): {
    takeProfitLevel: number;
    stopLossLevel: number;
    timeframe?: string;
  };
}