import { useAppStore } from '@/store';

export function useFetchBacktests() {
  const data = useAppStore((state) => state.backtests);
  const isLoading = useAppStore((state) => state.loading.fetchBacktests ?? false);
  const error = useAppStore((state) => state.errors.fetchBacktests ?? null);
  const run = useAppStore((state) => state.fetchBacktests);

  return { data, isLoading, error, run };
}

export function useBacktestDetail() {
  const backtest = useAppStore((state) => state.selectedBacktest);
  const trades = useAppStore((state) => state.backtestTrades);
  const isLoading = useAppStore((state) => state.loading.fetchBacktestDetail ?? false);
  const error = useAppStore((state) => state.errors.fetchBacktestDetail ?? null);
  const run = useAppStore((state) => state.fetchBacktestDetail);

  return { backtest, trades, isLoading, error, run };
}

export function useCreateBacktest() {
  const isLoading = useAppStore((state) => state.loading.createBacktest ?? false);
  const error = useAppStore((state) => state.errors.createBacktest ?? null);
  const run = useAppStore((state) => state.createBacktest);

  return { isLoading, error, run };
}