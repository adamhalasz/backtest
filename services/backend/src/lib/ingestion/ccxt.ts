import ccxt, {
  type Exchange,
  ExchangeNotAvailable,
  NetworkError,
  RateLimitExceeded,
  RequestTimeout,
} from 'ccxt';
import { AppError } from '../errors';
import type { IngestionTimeframe, OHLCVRow } from './types';

const DEFAULT_CCXT_PAGE_LIMIT = 1000;

type CcxtExchangeConstructor = new (options?: Record<string, unknown>) => Exchange;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getExchangeConstructor = (exchangeId: string): CcxtExchangeConstructor => {
  const ExchangeClass = ccxt[exchangeId as keyof typeof ccxt] as unknown;

  if (typeof ExchangeClass !== 'function') {
    throw new AppError(`Unsupported CCXT exchange: ${exchangeId}`, 400);
  }

  return ExchangeClass as CcxtExchangeConstructor;
};

const getTimeframeMs = (timeframe: IngestionTimeframe) => {
  switch (timeframe) {
    case '1m':
      return 60 * 1000;
    case '1h':
      return 60 * 60 * 1000;
    case '1d':
      return 24 * 60 * 60 * 1000;
  }
};

const normalizeOHLCV = (
  ohlcv: Array<number | string | null | undefined>,
  symbol: string,
  timeframe: IngestionTimeframe,
): OHLCVRow | null => {
  const [rawTimestamp, rawOpen, rawHigh, rawLow, rawClose, rawVolume] = ohlcv;
  const timestamp = Number(rawTimestamp);
  const open = Number(rawOpen);
  const high = Number(rawHigh);
  const low = Number(rawLow);
  const close = Number(rawClose);
  const volume = Number(rawVolume ?? 0);
  if (![timestamp, open, high, low, close].every((value) => Number.isFinite(value))) {
    return null;
  }

  return {
    symbol,
    asset_type: 'crypto',
    bar_time: new Date(timestamp).toISOString(),
    timeframe,
    open,
    high,
    low,
    close,
    volume: Number.isFinite(volume) ? volume : 0,
  };
};

const isRetriableCcxtError = (error: unknown) => {
  return error instanceof RateLimitExceeded
    || error instanceof RequestTimeout
    || error instanceof ExchangeNotAvailable
    || error instanceof NetworkError;
};

const fetchWithRetry = async <T>(operation: () => Promise<T>, maxRetries: number, retryDelayMs: number): Promise<T> => {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetriableCcxtError(error) || attempt >= maxRetries) {
        throw error;
      }

      attempt += 1;
      await sleep(retryDelayMs * attempt);
    }
  }
};

export const fetchCcxtIngestionRows = async (input: {
  symbol: string;
  sourceSymbol: string;
  exchangeId: string;
  timeframe: IngestionTimeframe;
  fromTime: string;
  toTime: string;
  rateLimitMs?: number;
  maxRetries?: number;
}): Promise<OHLCVRow[]> => {
  const ExchangeClass = getExchangeConstructor(input.exchangeId);
  const exchange = new ExchangeClass({
    enableRateLimit: true,
    rateLimit: input.rateLimitMs,
    timeout: 20000,
    options: {
      adjustForTimeDifference: true,
      maxRetriesOnFailure: 0,
    },
  });

  const timeframeMs = getTimeframeMs(input.timeframe);
  const fromMs = new Date(input.fromTime).getTime();
  const toMs = new Date(input.toTime).getTime();
  const retryDelayMs = input.rateLimitMs ?? exchange.rateLimit ?? 1000;
  const maxRetries = input.maxRetries ?? 3;
  const rows: OHLCVRow[] = [];
  let cursor = fromMs;

  try {
    await exchange.loadMarkets();

    if (!exchange.has.fetchOHLCV) {
      throw new AppError(`CCXT exchange ${input.exchangeId} does not support OHLCV fetching`, 400);
    }

    if (!exchange.markets[input.sourceSymbol]) {
      throw new AppError(`CCXT market ${input.sourceSymbol} is not available on ${input.exchangeId}`, 400);
    }

    while (cursor <= toMs) {
      const candles = await fetchWithRetry(
        () => exchange.fetchOHLCV(input.sourceSymbol, input.timeframe, cursor, DEFAULT_CCXT_PAGE_LIMIT),
        maxRetries,
        retryDelayMs,
      );

      if (candles.length === 0) {
        break;
      }

      let lastTimestamp = cursor;
      for (const candle of candles) {
        const normalized = normalizeOHLCV(
          candle as Array<number | string | null | undefined>,
          input.symbol,
          input.timeframe,
        );
        if (!normalized) {
          continue;
        }

        const barMs = new Date(normalized.bar_time).getTime();
        lastTimestamp = Math.max(lastTimestamp, barMs);
        if (barMs < fromMs || barMs > toMs) {
          continue;
        }

        const previous = rows.at(-1);
        if (!previous || previous.bar_time !== normalized.bar_time) {
          rows.push(normalized);
        }
      }

      const nextCursor = lastTimestamp + timeframeMs;
      if (nextCursor <= cursor) {
        break;
      }

      cursor = nextCursor;

      if (candles.length < DEFAULT_CCXT_PAGE_LIMIT) {
        break;
      }
    }

    return rows;
  } finally {
    if (typeof exchange.close === 'function') {
      await exchange.close();
    }
  }
};