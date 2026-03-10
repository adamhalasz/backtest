import { fetchMarketTicks } from '@/lib/api-client';

interface DukascopyTick {
  timestamp: Date;
  bid: number;
  ask: number;
  bidVolume: number;
  askVolume: number;
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
    onProgress?: (progress: number) => void
  ): Promise<DukascopyTick[]> {
    const ticks = await fetchMarketTicks({
      symbol,
      startDate: startTime.toISOString(),
      endDate: endTime.toISOString(),
      timeframe,
    });

    onProgress?.(100);
    return ticks;
  }
}