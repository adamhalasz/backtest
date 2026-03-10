import axios from 'axios';
import { DukascopyClient } from '@/lib/dukascopy';
import type { MarketAssetClass, MarketDataProviderId } from '@/lib/market';
import { buildMarketDataRequestSymbol, getDefaultProviderForAssetClass } from '@/lib/market';

export async function fetchBacktestData(
  startDate: string,
  endDate: string,
  symbol: string,
  assetClass: MarketAssetClass,
  provider?: MarketDataProviderId,
  timeframe: string = '1d'
): Promise<Array<{ date: Date; open: number; high: number; low: number; close: number; volume: number }>> {
  try {
    const dukascopyClient = DukascopyClient.getInstance();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const requestSymbol = buildMarketDataRequestSymbol(symbol, assetClass);
    const marketDataProvider = provider ?? getDefaultProviderForAssetClass(assetClass);

    // Validate dates
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }
    
    // Get ticks from Dukascopy
    const ticks = await dukascopyClient.getTicks(
      requestSymbol,
      start,
      end,
      timeframe,
      undefined,
      {
        assetClass,
          provider: marketDataProvider,
      },
    );
    
    // Convert ticks to OHLCV candles
    const intervalMs = (() => {
      switch (timeframe) {
        case '1m':
          return 60 * 1000;
        case '5m':
          return 5 * 60 * 1000;
        case '15m':
          return 15 * 60 * 1000;
        case '1h':
          return 60 * 60 * 1000;
        case '4h':
          return 4 * 60 * 60 * 1000;
        case '1d':
        default:
          return 24 * 60 * 60 * 1000;
      }
    })();
    const candles = new Map<number, {
      time: Date;
      date: Date;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>();
    
    for (const tick of ticks) {
      const bucketTime = Math.floor(tick.timestamp.getTime() / intervalMs) * intervalMs;
      const price = (tick.bid + tick.ask) / 2; // Use mid price
      
      if (!candles.has(bucketTime)) {
        candles.set(bucketTime, {
          time: new Date(bucketTime),
          date: new Date(bucketTime),
          open: price,
          high: price,
          low: price,
          close: price,
          volume: tick.bidVolume + tick.askVolume
        });
      } else {
        const candle = candles.get(bucketTime)!;
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
        candle.volume += tick.bidVolume + tick.askVolume;
      }
    }

    const data = Array.from(candles.values());
    
    if (data.length === 0) {
      throw new Error('No data available for the selected date range. Please choose a different period.');
    }
    
    return data.sort((a, b) => a.time.getTime() - b.time.getTime());

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 404) {
        throw new Error('No data available for the specified date range');
      }
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
    throw new Error('Failed to fetch market data');
  }
}