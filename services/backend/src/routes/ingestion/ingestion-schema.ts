import { z } from 'zod';

export const ingestionTriggerSchema = z.object({
  assetType: z.enum(['forex', 'crypto', 'stock']).optional(),
  timeframe: z.enum(['1m', '1h', '1d']),
  symbols: z.array(z.string().min(1)).optional(),
});

export const symbolBackfillSchema = z.object({
  symbol: z.string().min(1),
  assetType: z.enum(['forex', 'crypto', 'stock']),
  timeframe: z.enum(['1m', '1h', '1d']),
  fromDate: z.string().optional(),
});

export const ingestionSymbolSchema = z.object({
  symbol: z.string().min(1),
  assetType: z.enum(['forex', 'crypto', 'stock']),
  source: z.enum(['histdata', 'yahoo', 'ccxt']),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).default({}),
});

export const ingestionLogQuerySchema = z.object({
  assetType: z.enum(['forex', 'crypto', 'stock']).optional(),
  symbol: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
});