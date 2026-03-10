import type { z } from 'zod';
import type { MarketDataProviderId } from '../../lib/market-data-types';
import type { botSchema, statusSchema } from './bots-schema';

export type CreateBotInput = z.infer<typeof botSchema>;
export type UpdateBotStatusInput = z.infer<typeof statusSchema>;

export interface BotParameters {
  timeframe?: string;
  assetClass?: 'forex' | 'crypto' | 'stock';
  provider?: MarketDataProviderId;
  lastRun?: BotRunSummary;
  [key: string]: unknown;
}

export interface BotRunSummary {
  executedAt: string;
  timeframe: string;
  assetClass: 'forex' | 'crypto' | 'stock';
  provider: MarketDataProviderId;
  candleCount: number;
  signal: 'BUY' | 'SELL' | null;
  reason?: string;
  latestPrice: number;
  latestCandleAt: string;
 }

export interface BotRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  strategy: string;
  symbol: string;
  exchange: string;
  status: 'active' | 'paused' | 'stopped';
  parameters: BotParameters | string;
  last_trade_at: string | null;
  total_trades: number;
  win_rate: number;
  total_profit: number;
}