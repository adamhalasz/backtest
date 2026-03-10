import { z } from 'zod';

export const tradeSchema = z.object({
  type: z.enum(['BUY', 'SELL']),
  entryPrice: z.number(),
  entryTime: z.string(),
  exitPrice: z.number(),
  exitTime: z.string(),
  profit: z.number(),
  signals: z.record(z.string(), z.any()).optional().default({}),
  reason: z.string().optional().nullable(),
});

export const backtestInsertSchema = z.object({
  backtest: z.object({
    symbol: z.string(),
    exchange: z.string(),
    strategy: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    initial_balance: z.number(),
    final_balance: z.number(),
    win_rate: z.number(),
    profit_factor: z.number().nullable(),
    max_drawdown: z.number(),
    parameters: z.record(z.string(), z.any()).default({}),
  }),
  trades: z.array(tradeSchema),
});