import { useAppStore } from '@/store';

export function useFetchBots() {
  const data = useAppStore((state) => state.bots);
  const isLoading = useAppStore((state) => state.loading.fetchBots ?? false);
  const error = useAppStore((state) => state.errors.fetchBots ?? null);
  const run = useAppStore((state) => state.fetchBots);

  return { data, isLoading, error, run };
}

export function useUpdateBotStatus() {
  const isLoading = useAppStore((state) => state.loading.updateBotStatus ?? false);
  const error = useAppStore((state) => state.errors.updateBotStatus ?? null);
  const run = useAppStore((state) => state.updateBotStatus);

  return { isLoading, error, run };
}

export function useDeleteBot() {
  const isLoading = useAppStore((state) => state.loading.deleteBot ?? false);
  const error = useAppStore((state) => state.errors.deleteBot ?? null);
  const run = useAppStore((state) => state.deleteBot);

  return { isLoading, error, run };
}

export function useCreateBot() {
  const isLoading = useAppStore((state) => state.loading.createBot ?? false);
  const error = useAppStore((state) => state.errors.createBot ?? null);
  const run = useAppStore((state) => state.createBot);

  return { isLoading, error, run };
}