import { z } from 'zod';

export const marketDataQuerySchema = z.object({
  symbol: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  timeframe: z.string().min(1).default('1m'),
});

export type MarketDataQuery = z.infer<typeof marketDataQuerySchema>;