import { formatClickHouseDateTime, queryClickHouseJson } from './clickhouse';
import type { BackendEnv } from '../worker-types';
import type { MarketAssetClass, MarketCandle, MarketDataProvider } from './market-data-types';

interface ClickHouseRow {
  bar_time: string;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume: string | number;
}

const timeframeMs = (timeframe: string) => {
  switch (timeframe) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '1d': return 24 * 60 * 60 * 1000;
    case '1wk': return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 1000;
  }
};

const resolveSourceTimeframe = (assetClass: MarketAssetClass, timeframe: string) => {
  if (timeframe === '1wk') return '1d';
  if (timeframe === '4h') return assetClass === 'forex' ? '1m' : '1h';
  if (timeframe === '1h') return assetClass === 'forex' ? '1m' : '1h';
  if (timeframe === '5m' || timeframe === '15m') return '1m';
  if (timeframe === '1d') return assetClass === 'forex' ? '1m' : '1d';
  return timeframe;
};

const aggregateCandles = (candles: MarketCandle[], timeframe: string) => {
  const bucketMs = timeframeMs(timeframe);
  const grouped = new Map<number, MarketCandle>();

  for (const candle of candles) {
    const bucket = Math.floor(candle.timestamp / bucketMs) * bucketMs;
    const existing = grouped.get(bucket);

    if (!existing) {
      grouped.set(bucket, { ...candle, timestamp: bucket });
      continue;
    }

    existing.high = Math.max(existing.high, candle.high);
    existing.low = Math.min(existing.low, candle.low);
    existing.close = candle.close;
    existing.volume += candle.volume;
  }

  return [...grouped.values()].sort((left, right) => left.timestamp - right.timestamp);
};

const buildProvider = (env: BackendEnv): MarketDataProvider => ({
  id: 'clickhouse',
  async fetchCandles({ symbol, startTime, endTime, timeframe, assetClass }) {
    const sourceTimeframe = resolveSourceTimeframe(assetClass, timeframe);
    const fromTime = formatClickHouseDateTime(startTime);
    const toTime = formatClickHouseDateTime(endTime);
    const rows = await queryClickHouseJson<ClickHouseRow>(
      env,
      `SELECT bar_time, open, high, low, close, volume FROM ohlcv WHERE symbol = '${symbol.replace(/'/g, "''")}' AND asset_type = '${assetClass}' AND timeframe = '${sourceTimeframe}' AND bar_time >= toDateTime64('${fromTime}', 3, 'UTC') AND bar_time <= toDateTime64('${toTime}', 3, 'UTC') ORDER BY bar_time ASC`,
    );

    const candles = rows.map((row) => ({
      timestamp: new Date(row.bar_time).getTime(),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));

    if (sourceTimeframe === timeframe) {
      return candles;
    }

    return aggregateCandles(candles, timeframe);
  },
});

export const createClickHouseMarketDataProvider = (env: BackendEnv) => buildProvider(env);