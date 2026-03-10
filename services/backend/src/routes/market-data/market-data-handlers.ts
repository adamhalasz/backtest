import type { Context } from 'hono';
import { marketDataQuerySchema } from './market-data-schema';
import { AppError } from '../../lib/errors';
import { getMarketData } from './market-data-service';
import type { AppEnv } from '../../worker-types';

export const handleGetMarketTicks = async (c: Context<AppEnv>) => {
  const parsed = marketDataQuerySchema.safeParse({
    symbol: c.req.query('symbol'),
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
    timeframe: c.req.query('timeframe') || '1m',
    assetClass: c.req.query('assetClass') || undefined,
    provider: c.req.query('provider') || undefined,
  });

  if (!parsed.success) {
    throw new AppError('symbol, startDate and endDate are required', 400, parsed.error.flatten());
  }

  return c.json(await getMarketData(c.env, parsed.data));
};