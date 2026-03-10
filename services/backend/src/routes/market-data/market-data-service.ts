import { generateTicks } from '../../lib/market-data';
import { AppError } from '../../lib/errors';
import type { BackendEnv } from '../../worker-types';
import type { MarketDataQuery } from './market-data-schema';

export const getMarketData = async (env: BackendEnv, { symbol, startDate, endDate, timeframe, assetClass, provider }: MarketDataQuery) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new AppError('Invalid date range', 400);
  }

  if (start > new Date()) {
    throw new AppError('Future market data is not available', 400);
  }

  try {
    const ticks = await generateTicks(env, symbol, start, end, timeframe, assetClass, provider);

    return {
      symbol,
      timeframe,
      assetClass,
      provider: provider ?? 'yahoo',
      ticks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch market data';

    if (message.includes('429')) {
      throw new AppError('Market data provider is rate-limiting requests. Please try again shortly.', 429);
    }

    throw new AppError('Failed to fetch live market data', 502, { message });
  }
};