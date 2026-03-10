export type MarketAssetClass = 'forex' | 'crypto' | 'stock';

export type MarketDataProviderId = 'yahoo' | 'clickhouse';

export interface DukascopyTick {
  timestamp: string;
  bid: number;
  ask: number;
  bidVolume: number;
  askVolume: number;
}

export interface MarketCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataRequest {
  symbol: string;
  startTime: Date;
  endTime: Date;
  timeframe: string;
  assetClass?: MarketAssetClass;
  provider?: MarketDataProviderId;
}

export interface MarketDataProvider {
  id: MarketDataProviderId;
  fetchCandles(request: Required<Pick<MarketDataRequest, 'symbol' | 'startTime' | 'endTime' | 'timeframe' | 'assetClass'>>): Promise<MarketCandle[]>;
}
