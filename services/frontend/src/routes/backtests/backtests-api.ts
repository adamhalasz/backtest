import { getBacktest, listBacktests, listBacktestTrades, saveBacktestRun } from '@/lib/api-client';
import type { StoredBacktest, Trade } from '@/lib/types';

export type CreateBacktestPayload = {
  backtest: Omit<StoredBacktest, 'id' | 'created_at'>;
  trades: Trade[];
};

export const fetchBacktests = () => listBacktests();
export const fetchBacktest = (id: string) => getBacktest(id);
export const fetchBacktestTrades = (id: string) => listBacktestTrades(id);
export const createBacktest = (payload: CreateBacktestPayload) => saveBacktestRun(payload);