import { yahooMarketDataProvider } from '../market-data-yahoo-provider';
import type { MarketAssetClass } from '../market-data-types';
import type { IngestionTimeframe, OHLCVRow } from './types';

export const fetchYahooIngestionRows = async (input: {
  symbol: string;
  assetType: Exclude<MarketAssetClass, 'forex'>;
  timeframe: Extract<IngestionTimeframe, '1d' | '1h'>;
  fromTime: string;
  toTime: string;
}): Promise<OHLCVRow[]> => {
  const candles = await yahooMarketDataProvider.fetchCandles({
    symbol: input.symbol,
    assetClass: input.assetType,
    timeframe: input.timeframe,
    startTime: new Date(input.fromTime),
    endTime: new Date(input.toTime),
  });

  return candles.map((candle) => ({
    symbol: input.symbol,
    asset_type: input.assetType,
    bar_time: new Date(candle.timestamp).toISOString(),
    timeframe: input.timeframe,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));
};