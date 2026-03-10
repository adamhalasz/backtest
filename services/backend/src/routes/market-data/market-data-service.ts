import { generateTicks } from '../../lib/market-data';
import { AppError } from '../../lib/errors';
import type { MarketDataQuery } from './market-data-schema';

export const getMarketData = ({ symbol, startDate, endDate, timeframe }: MarketDataQuery) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new AppError('Invalid date range', 400);
  }

  return {
    symbol,
    timeframe,
    ticks: generateTicks(start, end, timeframe),
  };
};