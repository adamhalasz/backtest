import type { z } from 'zod';
import type { backtestRequestSchema } from './backtests-schema';

export type BacktestRequestInput = z.infer<typeof backtestRequestSchema>;
export type BacktestStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface StoredBacktestRow {
  id: string;
  user_id: string;
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
  profit_factor: number | null;
  max_drawdown: number;
  status: BacktestStatus;
  workflow_instance_id: string | null;
  error_message: string | null;
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