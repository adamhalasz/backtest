import { useAppStore } from '@/store';

export function useFetchStrategyStats() {
  const data = useAppStore((state) => state.strategyStats);
  const isLoading = useAppStore((state) => state.loading.fetchStrategyStats ?? false);
  const error = useAppStore((state) => state.errors.fetchStrategyStats ?? null);
  const run = useAppStore((state) => state.fetchStrategyStats);

  return { data, isLoading, error, run };
}