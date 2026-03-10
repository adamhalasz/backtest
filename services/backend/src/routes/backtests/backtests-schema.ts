import { z } from 'zod';

export const backtestRequestSchema = z.object({
  backtest: z.object({
    symbol: z.string(),
    exchange: z.string(),
    strategy: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    initial_balance: z.number(),
    parameters: z.record(z.string(), z.any()).default({}),
  }),
});