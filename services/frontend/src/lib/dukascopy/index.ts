import { fetchMarketTicks } from '@/lib/api-client';
import type { MarketAssetClass, MarketDataProviderId } from '@/lib/market';

interface DukascopyTick {
  timestamp: Date;
  bid: number;
  ask: number;
  bidVolume: number;
  askVolume: number;
}

interface MarketDataOptions {
  assetClass?: MarketAssetClass;
  provider?: MarketDataProviderId;
}

export class DukascopyClient {
  private static instance: DukascopyClient;

  private constructor() {}

  public static getInstance(): DukascopyClient {
    if (!DukascopyClient.instance) {
      DukascopyClient.instance = new DukascopyClient();
    }
    return DukascopyClient.instance;
  }

  public async getTicks(
    symbol: string,
    startTime: Date,
    endTime: Date,
    timeframe: string = 'M1',
    onProgress?: (progress: number) => void,
    options: MarketDataOptions = {},
  ): Promise<DukascopyTick[]> {
    const ticks = await fetchMarketTicks({
      symbol,
      startDate: startTime.toISOString(),
      endDate: endTime.toISOString(),
      timeframe,
      assetClass: options.assetClass,
      provider: options.provider,
    });

    onProgress?.(100);
    return ticks;
  }
}