import { z } from 'zod';

export const botSchema = z.object({
  name: z.string().min(1),
  strategy: z.string(),
  symbol: z.string(),
  exchange: z.string(),
  status: z.enum(['active', 'paused', 'stopped']),
  parameters: z.record(z.string(), z.any()),
});

export const statusSchema = z.object({
  status: z.enum(['active', 'paused', 'stopped']),
});