import { getBacktest, listBacktests, listBacktestTrades, queueBacktestRun } from '@/lib/api-client';
import type { StoredBacktest } from '@/lib/types';

export type CreateBacktestPayload = {
  backtest: Pick<StoredBacktest, 'symbol' | 'exchange' | 'strategy' | 'start_date' | 'end_date' | 'initial_balance' | 'parameters'>;
};

export const fetchBacktests = () => listBacktests();
export const fetchBacktest = (id: string) => getBacktest(id);
export const fetchBacktestTrades = (id: string) => listBacktestTrades(id);
export const createBacktest = (payload: CreateBacktestPayload) => queueBacktestRun(payload);