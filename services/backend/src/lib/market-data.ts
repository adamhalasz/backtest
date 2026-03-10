import { getMarketDataProvider } from './market-data-provider-registry';
import { inferAssetClass } from './market-data-yahoo-provider';
import type { DukascopyTick, MarketAssetClass, MarketDataProviderId, MarketCandle } from './market-data-types';
import type { BackendEnv } from '../worker-types';

interface CacheEntry {
  expiresAt: number;
  staleUntil: number;
  ticks: DukascopyTick[];
}

const marketDataCache = new Map<string, CacheEntry>();
const inflightMarketData = new Map<string, Promise<DukascopyTick[]>>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 60 * 60 * 1000;

const timeframeToIncrement = (timeframe: string): number => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  switch (timeframe) {
    case '1m':
    case 'M1':
      return minute;
    case '5m':
    case 'M5':
      return 5 * minute;
    case '15m':
    case 'M15':
      return 15 * minute;
    case '1h':
    case 'H1':
      return hour;
    case '4h':
    case 'H4':
      return 4 * hour;
    case '1d':
    case 'D1':
      return day;
    default:
      return minute;
  }
};

const buildCacheKey = (
  symbol: string,
  assetClass: MarketAssetClass,
  provider: MarketDataProviderId,
  startTime: Date,
  endTime: Date,
  timeframe: string,
) => {
  return [provider, assetClass, symbol.toUpperCase(), timeframe, startTime.toISOString(), endTime.toISOString()].join(':');
};

const candlesToTicks = (candles: MarketCandle[], timeframe: string): DukascopyTick[] => {
  const increment = timeframeToIncrement(timeframe);

  return candles.flatMap((candle) => {
    const spread = Math.max(0.00001, Math.abs(candle.high - candle.low) * 0.02);
    const volumePerTick = candle.volume > 0 ? Math.max(1, Math.floor(candle.volume / 4)) : 0;
    const path = candle.close >= candle.open
      ? [candle.open, candle.low, candle.high, candle.close]
      : [candle.open, candle.high, candle.low, candle.close];

    return path.map((price, index) => ({
      timestamp: new Date(candle.timestamp + Math.floor((increment / 4) * index)).toISOString(),
      bid: price,
      ask: price + spread,
      bidVolume: volumePerTick,
      askVolume: volumePerTick,
    }));
  });
};

export const generateTicks = async (
  env: BackendEnv,
  symbol: string,
  startTime: Date,
  endTime: Date,
  timeframe: string,
  assetClass?: MarketAssetClass,
  provider: MarketDataProviderId = 'yahoo',
): Promise<DukascopyTick[]> => {
  const resolvedAssetClass = assetClass ?? inferAssetClass(symbol);
  const cacheKey = buildCacheKey(symbol, resolvedAssetClass, provider, startTime, endTime, timeframe);
  const now = Date.now();
  const cached = marketDataCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.ticks;
  }

  const inflight = inflightMarketData.get(cacheKey);

  if (inflight) {
    return inflight;
  }

  const marketDataProvider = getMarketDataProvider(provider, env);
  const request = (async () => {
    try {
      const candles = await marketDataProvider.fetchCandles({
        symbol,
        startTime,
        endTime,
        timeframe,
        assetClass: resolvedAssetClass,
      });
      const ticks = candlesToTicks(candles, timeframe);

      marketDataCache.set(cacheKey, {
        ticks,
        expiresAt: Date.now() + CACHE_TTL_MS,
        staleUntil: Date.now() + STALE_TTL_MS,
      });

      return ticks;
    } catch (error) {
      if (cached && cached.staleUntil > Date.now()) {
        return cached.ticks;
      }

      throw error;
    } finally {
      inflightMarketData.delete(cacheKey);
    }
  })();

  inflightMarketData.set(cacheKey, request);
  return request;
};