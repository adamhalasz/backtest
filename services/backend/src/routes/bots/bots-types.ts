import type { z } from 'zod';
import type { botSchema, statusSchema } from './bots-schema';

export type CreateBotInput = z.infer<typeof botSchema>;
export type UpdateBotStatusInput = z.infer<typeof statusSchema>;

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
  parameters: Record<string, unknown> | string;
  last_trade_at: string | null;
  total_trades: number;
  win_rate: number;
  total_profit: number;
}