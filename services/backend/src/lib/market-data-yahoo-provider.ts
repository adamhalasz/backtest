import type { MarketAssetClass, MarketCandle, MarketDataProvider } from './market-data-types';

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
      error?: {
        description?: string;
      } | null;
    }>;
    error?: {
      description?: string;
    } | null;
  };
}

interface TimeframeConfig {
  sourceInterval: string;
  sourceChunkMs: number;
  candleMs: number;
}

const timeframeConfigs: Record<string, TimeframeConfig> = {
  '1m': {
    sourceInterval: '1m',
    sourceChunkMs: 7 * 24 * 60 * 60 * 1000,
    candleMs: 60 * 1000,
  },
  '5m': {
    sourceInterval: '5m',
    sourceChunkMs: 60 * 24 * 60 * 60 * 1000,
    candleMs: 5 * 60 * 1000,
  },
  '15m': {
    sourceInterval: '15m',
    sourceChunkMs: 60 * 24 * 60 * 60 * 1000,
    candleMs: 15 * 60 * 1000,
  },
  '1h': {
    sourceInterval: '1h',
    sourceChunkMs: 730 * 24 * 60 * 60 * 1000,
    candleMs: 60 * 60 * 1000,
  },
  '4h': {
    sourceInterval: '1h',
    sourceChunkMs: 730 * 24 * 60 * 60 * 1000,
    candleMs: 4 * 60 * 60 * 1000,
  },
  '1d': {
    sourceInterval: '1d',
    sourceChunkMs: 3650 * 24 * 60 * 60 * 1000,
    candleMs: 24 * 60 * 60 * 1000,
  },
};

const knownFiatCurrencies = new Set([
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'HKD', 'INR', 'JPY', 'KRW', 'MXN', 'NZD', 'SGD', 'USD',
]);

const knownCryptoAssets = new Set([
  'ADA', 'AVAX', 'BCH', 'BNB', 'BTC', 'DOGE', 'DOT', 'ETH', 'LINK', 'LTC', 'MATIC', 'SOL', 'TRX', 'UNI', 'XLM', 'XRP',
]);

const knownCryptoQuotes = ['USDT', 'USD', 'USDC', 'BTC', 'ETH', 'EUR'] as const;

const resolveTimeframeConfig = (timeframe: string): TimeframeConfig => {
  return timeframeConfigs[timeframe] ?? timeframeConfigs['1m'];
};

export const inferAssetClass = (symbol: string): MarketAssetClass => {
  const normalized = symbol.replace(/\s+/g, '').toUpperCase();

  if (normalized.includes('-')) {
    return 'crypto';
  }

  if (normalized.includes('/')) {
    const [base, quote] = normalized.split('/');

    if (knownFiatCurrencies.has(base) && knownFiatCurrencies.has(quote)) {
      return 'forex';
    }

    if (knownCryptoAssets.has(base) || knownCryptoAssets.has(quote)) {
      return 'crypto';
    }
  }

  if (/^[A-Z]{6}$/.test(normalized)) {
    const base = normalized.slice(0, 3);
    const quote = normalized.slice(3);

    if (knownFiatCurrencies.has(base) && knownFiatCurrencies.has(quote)) {
      return 'forex';
    }

    if (knownCryptoAssets.has(base) || knownCryptoAssets.has(quote)) {
      return 'crypto';
    }
  }

  return 'stock';
};

const normalizeCryptoSymbol = (symbol: string) => {
  const normalized = symbol.replace(/\s+/g, '').toUpperCase();

  if (normalized.includes('-')) {
    return normalized;
  }

  if (normalized.includes('/')) {
    return normalized.replace('/', '-');
  }

  const matchedQuote = knownCryptoQuotes.find((quote) => normalized.endsWith(quote));

  if (matchedQuote && normalized.length > matchedQuote.length) {
    return `${normalized.slice(0, -matchedQuote.length)}-${matchedQuote}`;
  }

  return normalized;
};

export const normalizeYahooSymbol = (symbol: string, assetClass: MarketAssetClass) => {
  const normalized = symbol.replace(/\s+/g, '').toUpperCase();

  switch (assetClass) {
    case 'forex':
      return `${normalized.replace('/', '')}=X`;
    case 'crypto':
      return normalizeCryptoSymbol(normalized);
    case 'stock':
    default:
      return normalized;
  }
};

const buildYahooChartUrl = (symbol: string, interval: string, startTime: Date, endTime: Date) => {
  const params = new URLSearchParams({
    interval,
    period1: String(Math.floor(startTime.getTime() / 1000)),
    period2: String(Math.floor(endTime.getTime() / 1000)),
    includePrePost: 'false',
    events: 'div,splits,capitalGains',
  });

  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params.toString()}`;
};

const parseYahooCandles = (payload: YahooChartResponse): MarketCandle[] => {
  const result = payload.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp ?? [];
  const opens = quote?.open ?? [];
  const highs = quote?.high ?? [];
  const lows = quote?.low ?? [];
  const closes = quote?.close ?? [];
  const volumes = quote?.volume ?? [];

  return timestamps.flatMap((timestamp, index) => {
    const open = opens[index];
    const high = highs[index];
    const low = lows[index];
    const close = closes[index];

    if ([open, high, low, close].some((value) => value == null || Number.isNaN(value))) {
      return [];
    }

    return [{
      timestamp: timestamp * 1000,
      open: open as number,
      high: high as number,
      low: low as number,
      close: close as number,
      volume: Math.max(0, volumes[index] ?? 0),
    }];
  });
};

const fetchYahooCandles = async (
  symbol: string,
  interval: string,
  startTime: Date,
  endTime: Date,
): Promise<MarketCandle[]> => {
  const response = await fetch(buildYahooChartUrl(symbol, interval, startTime, endTime), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://finance.yahoo.com/',
      'User-Agent': 'Mozilla/5.0 (compatible; BacktestBot/1.0; +https://finance.yahoo.com/)',
    },
  });

  if (!response.ok) {
    throw new Error(`Market data provider returned ${response.status}`);
  }

  const payload = await response.json<YahooChartResponse>();
  const providerError = payload.chart?.error?.description ?? payload.chart?.result?.[0]?.error?.description;

  if (providerError) {
    throw new Error(providerError);
  }

  return parseYahooCandles(payload);
};

const dedupeCandles = (candles: MarketCandle[]) => {
  const byTimestamp = new Map<number, MarketCandle>();

  for (const candle of candles) {
    byTimestamp.set(candle.timestamp, candle);
  }

  return [...byTimestamp.values()].sort((left, right) => left.timestamp - right.timestamp);
};

const aggregateCandles = (candles: MarketCandle[], timeframe: string): MarketCandle[] => {
  const config = resolveTimeframeConfig(timeframe);
  const sourceConfig = resolveTimeframeConfig(timeframe === '4h' ? '1h' : timeframe);

  if (config.candleMs === sourceConfig.candleMs) {
    return candles;
  }

  const grouped = new Map<number, MarketCandle>();

  for (const candle of candles) {
    const bucketTimestamp = Math.floor(candle.timestamp / config.candleMs) * config.candleMs;
    const existing = grouped.get(bucketTimestamp);

    if (!existing) {
      grouped.set(bucketTimestamp, {
        timestamp: bucketTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      });
      continue;
    }

    existing.high = Math.max(existing.high, candle.high);
    existing.low = Math.min(existing.low, candle.low);
    existing.close = candle.close;
    existing.volume += candle.volume;
  }

  return [...grouped.values()].sort((left, right) => left.timestamp - right.timestamp);
};

export const yahooMarketDataProvider: MarketDataProvider = {
  id: 'yahoo',
  async fetchCandles({ symbol, startTime, endTime, timeframe, assetClass }) {
    const config = resolveTimeframeConfig(timeframe);
    const normalizedSymbol = normalizeYahooSymbol(symbol, assetClass);
    const candles: MarketCandle[] = [];
    let chunkStart = startTime.getTime();

    while (chunkStart < endTime.getTime()) {
      const chunkEnd = Math.min(chunkStart + config.sourceChunkMs, endTime.getTime());
      const chunkCandles = await fetchYahooCandles(
        normalizedSymbol,
        config.sourceInterval,
        new Date(chunkStart),
        new Date(chunkEnd),
      );

      candles.push(...chunkCandles);
      chunkStart = chunkEnd + 1;
    }

    const dedupedCandles = dedupeCandles(candles).filter((candle) => {
      return candle.timestamp >= startTime.getTime() && candle.timestamp <= endTime.getTime();
    });

    return aggregateCandles(dedupedCandles, timeframe);
  },
};
