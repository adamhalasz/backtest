import { createBotRecord, deleteBotRecord, listBots, updateBotStatus } from '@/lib/api-client';
import type { Bot } from '@/lib/types';

export type CreateBotPayload = Omit<
  Bot,
  'id' | 'created_at' | 'updated_at' | 'last_trade_at' | 'total_trades' | 'win_rate' | 'total_profit'
>;

export const fetchBots = () => listBots();
export const createBot = (payload: CreateBotPayload) => createBotRecord(payload);
export const changeBotStatus = (botId: string, status: Bot['status']) => updateBotStatus(botId, status);
export const removeBot = (botId: string) => deleteBotRecord(botId);