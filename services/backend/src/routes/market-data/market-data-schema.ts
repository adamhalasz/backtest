import { z } from 'zod';

export const marketDataQuerySchema = z.object({
  symbol: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  timeframe: z.string().min(1).default('1m'),
  assetClass: z.enum(['forex', 'crypto', 'stock']).optional(),
  provider: z.enum(['yahoo', 'clickhouse']).optional(),
});

export type MarketDataQuery = z.infer<typeof marketDataQuerySchema>;