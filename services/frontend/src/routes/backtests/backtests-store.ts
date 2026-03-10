import type { Bot, StoredBacktest, Trade } from '@/lib/types';
import { withLoading } from '@/store/asyncWrapper';
import * as api from './backtests-api';

export const backtestsSlice = (set: any, get: any) => ({
  backtests: [] as StoredBacktest[],
  selectedBacktest: null as StoredBacktest | null,
  backtestTrades: [] as Trade[],

  fetchBacktests: async () => {
    return withLoading(
      'fetchBacktests',
      async (_set, _get, setKey) => {
        const backtests = await api.fetchBacktests();
        setKey('backtests', backtests);
      },
      set,
      get,
    );
  },

  fetchBacktestDetail: async (backtestId: string) => {
    return withLoading(
      'fetchBacktestDetail',
      async (_set, _get, setKey, _setError, id: string) => {
        const [backtest, trades] = await Promise.all([
          api.fetchBacktest(id),
          api.fetchBacktestTrades(id),
        ]);

        setKey('selectedBacktest', backtest);
        setKey('backtestTrades', trades);
      },
      set,
      get,
      backtestId,
    );
  },

  createBacktest: async (payload: api.CreateBacktestPayload) => {
    return withLoading(
      'createBacktest',
      async (_set, _get, setKey, _setError, requestPayload: api.CreateBacktestPayload) => {
        const createdBacktest = await api.createBacktest(requestPayload);
        setKey('backtests', [createdBacktest, ...get().backtests]);
        setKey('selectedBacktest', createdBacktest);
      },
      set,
      get,
      payload,
    );
  },
});