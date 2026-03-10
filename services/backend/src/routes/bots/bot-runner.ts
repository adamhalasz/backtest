import { AppError } from '../../lib/errors';
import { getMarketDataProvider } from '../../lib/market-data-provider-registry';
import { inferAssetClass } from '../../lib/market-data-yahoo-provider';
import type { MarketAssetClass, MarketCandle, MarketDataProviderId } from '../../lib/market-data-types';
import type { BotParameters, BotRow, BotRunSummary } from './bots-types';

type StrategySignal = {
  type: 'BUY' | 'SELL' | null;
  reason?: string;
};

interface RunnerContext {
  assetClass: MarketAssetClass;
  provider: MarketDataProviderId;
  timeframe: string;
}

const parseBotParameters = (parameters: BotRow['parameters']): BotParameters => {
  if (!parameters) {
    return {};
  }

  if (typeof parameters === 'string') {
    try {
      return JSON.parse(parameters) as BotParameters;
    } catch {
      return {};
    }
  }

  return parameters;
};

const resolveRunnerContext = (bot: BotRow): RunnerContext => {
  const parameters = parseBotParameters(bot.parameters);

  return {
    assetClass: parameters.assetClass ?? inferAssetClass(bot.symbol),
    provider: parameters.provider ?? 'yahoo',
    timeframe: parameters.timeframe ?? '5m',
  };
};

const getLookbackWindowMs = (timeframe: string) => {
  switch (timeframe) {
    case '1m':
      return 3 * 24 * 60 * 60 * 1000;
    case '5m':
      return 7 * 24 * 60 * 60 * 1000;
    case '15m':
      return 14 * 24 * 60 * 60 * 1000;
    case '1h':
      return 60 * 24 * 60 * 60 * 1000;
    case '4h':
      return 180 * 24 * 60 * 60 * 1000;
    case '1d':
    default:
      return 365 * 24 * 60 * 60 * 1000;
  }
};

const calculateRSI = (candles: MarketCandle[], index: number, period: number = 14) => {
  if (index < period) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let i = index - period + 1; i <= index; i += 1) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateEMAFromValues = (values: number[], period: number) => {
  if (values.length === 0) {
    return 0;
  }

  if (values.length < period) {
    return values[values.length - 1];
  }

  const multiplier = 2 / (period + 1);
  let ema = values[0];

  for (let i = 1; i < values.length; i += 1) {
    ema = (values[i] - ema) * multiplier + ema;
  }

  return ema;
};

const calculateEMA = (candles: MarketCandle[], index: number, period: number) => {
  const values = candles.slice(0, index + 1).map((candle) => candle.close);
  return calculateEMAFromValues(values, period);
};

const calculateMACD = (candles: MarketCandle[], index: number) => {
  const fastPeriod = 12;
  const slowPeriod = 26;
  const signalPeriod = 9;

  if (index < slowPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const macdValues: number[] = [];

  for (let i = 0; i <= index; i += 1) {
    if (i < slowPeriod) {
      macdValues.push(0);
      continue;
    }

    const fastEMA = calculateEMA(candles, i, fastPeriod);
    const slowEMA = calculateEMA(candles, i, slowPeriod);
    macdValues.push(fastEMA - slowEMA);
  }

  const macdLine = macdValues[index];
  const signalLine = calculateEMAFromValues(macdValues.slice(Math.max(0, index - signalPeriod * 3), index + 1), signalPeriod);
  const histogram = macdLine - signalLine;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
};

const evaluateMomentumStrategy = (candles: MarketCandle[]): StrategySignal => {
  const index = candles.length - 1;

  if (index < 26) {
    return { type: null };
  }

  const rsi = calculateRSI(candles, index);
  const macd = calculateMACD(candles, index);
  const previousMacd = calculateMACD(candles, index - 1);
  const currentPrice = candles[index].close;
  const previousPrice = candles[index - 1].close;
  const priceChange = previousPrice === 0 ? 0 : (currentPrice - previousPrice) / previousPrice;

  if (
    (rsi < 40 && macd.macd > macd.signal && previousMacd.macd <= previousMacd.signal) ||
    (rsi < 45 && macd.histogram > 0 && priceChange > 0.001) ||
    (macd.macd > macd.signal && macd.histogram > previousMacd.histogram * 1.5)
  ) {
    return {
      type: 'BUY',
      reason: 'RSI indicates oversold conditions with MACD bullish crossover',
    };
  }

  if (
    (rsi > 60 && macd.macd < macd.signal && previousMacd.macd >= previousMacd.signal) ||
    (rsi > 55 && macd.histogram < 0 && priceChange < -0.001) ||
    (macd.macd < macd.signal && macd.histogram < previousMacd.histogram * 1.5)
  ) {
    return {
      type: 'SELL',
      reason: 'RSI indicates overbought conditions with MACD bearish crossover',
    };
  }

  return { type: null };
};

const evaluateStrategy = (strategyName: string, candles: MarketCandle[]): StrategySignal => {
  switch (strategyName) {
    case 'Momentum Strategy':
      return evaluateMomentumStrategy(candles);
    default:
      throw new AppError(`Bot runner does not support ${strategyName} yet`, 501);
  }
};

export const executeBotRun = async (bot: BotRow): Promise<BotRunSummary> => {
  const context = resolveRunnerContext(bot);
  const provider = getMarketDataProvider(context.provider);
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - getLookbackWindowMs(context.timeframe));
  const candles = await provider.fetchCandles({
    symbol: bot.symbol,
    startTime,
    endTime,
    timeframe: context.timeframe,
    assetClass: context.assetClass,
  });

  if (candles.length < 30) {
    throw new AppError('Not enough market data to evaluate this bot yet', 422, { candleCount: candles.length });
  }

  const signal = evaluateStrategy(bot.strategy, candles);
  const latestCandle = candles[candles.length - 1];

  return {
    executedAt: new Date().toISOString(),
    timeframe: context.timeframe,
    assetClass: context.assetClass,
    provider: context.provider,
    candleCount: candles.length,
    signal: signal.type,
    reason: signal.reason,
    latestPrice: latestCandle.close,
    latestCandleAt: new Date(latestCandle.timestamp).toISOString(),
  };
};