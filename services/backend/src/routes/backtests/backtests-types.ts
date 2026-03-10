import type { z } from 'zod';
import type { backtestInsertSchema, tradeSchema } from './backtests-schema';

export type TradeInput = z.infer<typeof tradeSchema>;
export type BacktestInsertInput = z.infer<typeof backtestInsertSchema>;

export interface StoredBacktestRow {
  id: string;
  user_id: string;
  created_at: string;
  symbol: string;
  exchange: string;
  strategy: string;
  start_date: string;
  end_date: string;
  initial_balance: number;
  final_balance: number;
  win_rate: number;
  profit_factor: number | null;
  max_drawdown: number;
  parameters: Record<string, unknown> | string;
}

export interface StoredTradeRow {
  id: string;
  backtest_id: string;
  user_id: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  entry_time: string;
  exit_price: number;
  exit_time: string;
  profit: number;
  signals: Record<string, unknown> | string;
  reason: string | null;
}