import { AppError } from '../errors';
import { getMarketDataProvider } from '../market-data-provider-registry';
import { inferAssetClass } from '../market-data-yahoo-provider';
import type { MarketAssetClass, MarketDataProviderId } from '../market-data-types';
import { calculateMACD, calculateRSI } from './indicators';
import { getStrategy } from './strategies';
import { EntryFrequency } from './types';
import type { BacktestExecutionConfig, BacktestRunResult, Candle, Trade } from './types';

const EXCHANGES = [
  { id: 'london', name: 'London', timezone: 'Europe/London', hours: { open: 8, close: 16 }, isAlwaysOpen: false },
  { id: 'newyork', name: 'New York', timezone: 'America/New_York', hours: { open: 8, close: 17 }, isAlwaysOpen: false },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', hours: { open: 9, close: 18 }, isAlwaysOpen: false },
  { id: 'nasdaq', name: 'NASDAQ', timezone: 'America/New_York', hours: { open: 9, close: 16 }, isAlwaysOpen: false },
  { id: 'nyse', name: 'NYSE', timezone: 'America/New_York', hours: { open: 9, close: 16 }, isAlwaysOpen: false },
  { id: 'crypto', name: 'Global Crypto Market', timezone: 'Etc/UTC', hours: { open: 0, close: 24 }, isAlwaysOpen: true },
] as const;

const getMinTimeBetweenTrades = (entryFrequency: EntryFrequency) => {
  switch (entryFrequency) {
    case EntryFrequency.SCALPING:
      return 1;
    case EntryFrequency.DAILY:
      return 24;
    case EntryFrequency.WEEKLY:
      return 24 * 7;
    case EntryFrequency.MONTHLY:
      return 24 * 30;
    case EntryFrequency.QUARTERLY:
      return 24 * 90;
    default:
      return 24;
  }
};

const formatDatePart = (date: Date, timeZone: string, options: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat('en-CA', { timeZone, ...options }).format(date);
};

const getHourInTimeZone = (date: Date, timeZone: string) => {
  return Number.parseInt(formatDatePart(date, timeZone, { hour: '2-digit', hour12: false }), 10);
};

const getDayKey = (date: Date) => formatDatePart(date, 'UTC', { year: 'numeric', month: '2-digit', day: '2-digit' });

const calculateVolatility = (candles: Candle[], index: number) => {
  const period = 20;
  const startIndex = Math.max(0, index - period);
  const prices = candles.slice(startIndex, index + 1).map((candle) => candle.close);
  if (prices.length < 2) return 0;

  const returns = prices.slice(1).map((price, priceIndex) => (price - prices[priceIndex]) / prices[priceIndex]);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
};

const calculateMaxDrawdown = (initialBalance: number, trades: Trade[]) => {
  let peak = -Infinity;
  let runningBalance = initialBalance;
  let maxDrawdown = 0;

  for (const trade of trades) {
    runningBalance += trade.profit;
    if (runningBalance > peak) {
      peak = runningBalance;
    }
    if (peak > 0) {
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  return maxDrawdown;
};

const buildCandleSeries = async (config: BacktestExecutionConfig): Promise<Candle[]> => {
  const provider = getMarketDataProvider(config.provider);
  const startTime = new Date(config.startDate);
  const endTime = new Date(config.endDate);

  if (startTime >= endTime) {
    throw new AppError('Start date must be before end date', 400);
  }

  const candles = await provider.fetchCandles({
    symbol: config.symbol,
    startTime,
    endTime,
    timeframe: config.timeframe,
    assetClass: config.assetClass,
  });
  const exchange = EXCHANGES.find((item) => item.id === config.exchange);

  if (!exchange) {
    throw new AppError(`Invalid exchange: ${config.exchange}`, 400);
  }

  return candles
    .map((candle) => ({
      time: new Date(candle.timestamp),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }))
    .filter((candle) => {
      if (config.timeframe === '1d' || exchange.isAlwaysOpen) {
        return true;
      }

      const hour = getHourInTimeZone(candle.time, exchange.timezone);
      return hour >= exchange.hours.open && hour < exchange.hours.close;
    });
};

export const resolveBacktestExecutionConfig = (input: {
  symbol: string;
  exchange: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  parameters: Record<string, unknown>;
}): BacktestExecutionConfig => {
  const strategy = getStrategy(input.strategy);
  if (!strategy) {
    throw new AppError(`Unsupported strategy: ${input.strategy}`, 501);
  }

  return {
    symbol: input.symbol,
    exchange: input.exchange,
    strategy: input.strategy,
    startDate: input.startDate,
    endDate: input.endDate,
    initialBalance: input.initialBalance,
    timeframe: typeof input.parameters.timeframe === 'string' ? input.parameters.timeframe : strategy.defaultConfig.timeframe ?? '1d',
    entryFrequency: Object.values(EntryFrequency).includes(input.parameters.entryFrequency as EntryFrequency)
      ? (input.parameters.entryFrequency as EntryFrequency)
      : strategy.defaultFrequency,
    assetClass: (input.parameters.assetClass as MarketAssetClass | undefined) ?? inferAssetClass(input.symbol),
    provider: (input.parameters.provider as MarketDataProviderId | undefined) ?? 'yahoo',
    riskPerTrade: typeof input.parameters.riskPerTrade === 'number' ? input.parameters.riskPerTrade : 2,
    maxTradeTime: typeof input.parameters.maxTradeTime === 'number' ? input.parameters.maxTradeTime : 8,
    takeProfitLevel: typeof input.parameters.takeProfitLevel === 'number' ? input.parameters.takeProfitLevel : undefined,
    stopLossLevel: typeof input.parameters.stopLossLevel === 'number' ? input.parameters.stopLossLevel : undefined,
  };
};

export const runBacktest = async (config: BacktestExecutionConfig): Promise<BacktestRunResult> => {
  const strategy = getStrategy(config.strategy);
  if (!strategy) {
    throw new AppError(`Unsupported strategy: ${config.strategy}`, 501);
  }

  const candles = await buildCandleSeries(config);
  if (candles.length < strategy.minCandles) {
    throw new AppError(
      `Insufficient data for backtesting with ${strategy.name}. Need at least ${strategy.minCandles} candles but only ${candles.length} were available.`,
      422,
    );
  }

  const exchange = EXCHANGES.find((item) => item.id === config.exchange)!;
  const minTimeBetweenTrades = getMinTimeBetweenTrades(config.entryFrequency);
  const maxDailyTrades = config.entryFrequency === EntryFrequency.SCALPING ? 5 : 1;
  let balance = config.initialBalance;
  let position: {
    type: 'BUY' | 'SELL';
    entryPrice: number;
    entryTime: Date;
    signals: Record<string, unknown>;
  } | null = null;
  let lastTradeExitTime: Date | null = null;
  let currentTradeDate = '';
  let dailyTradeCount = 0;
  const trades: Trade[] = [];

  const calculatePositionSize = (price: number) => {
    const riskAmount = balance * (config.riskPerTrade / 100);
    return riskAmount / price;
  };

  for (let index = 0; index < candles.length; index += 1) {
    const signal = strategy.calculateSignal(candles, index);
    const currentCandle = candles[index];
    const previousCandle = index > 0 ? candles[index - 1] : null;
    const rsi = calculateRSI(candles, index);
    const macd = calculateMACD(candles, index);
    const volatility = calculateVolatility(candles, index);
    const exchangeHour = getHourInTimeZone(currentCandle.time, exchange.timezone);
    const candleDate = getDayKey(currentCandle.time);

    if (candleDate !== currentTradeDate) {
      currentTradeDate = candleDate;
      dailyTradeCount = 0;
    }

    const hoursSinceLastTrade = !lastTradeExitTime
      ? Number.POSITIVE_INFINITY
      : (currentCandle.time.getTime() - lastTradeExitTime.getTime()) / (1000 * 60 * 60);
    const withinExchangeHours = config.timeframe === '1d' || exchange.isAlwaysOpen ||
      (exchangeHour >= exchange.hours.open && exchangeHour < exchange.hours.close);
    const canTrade = hoursSinceLastTrade >= minTimeBetweenTrades && dailyTradeCount < maxDailyTrades && withinExchangeHours;

    if (!position && signal.type && canTrade && previousCandle) {
      dailyTradeCount += 1;
      const defaults = strategy.defaultConfig;
      position = {
        type: signal.type,
        entryPrice: currentCandle.close,
        entryTime: currentCandle.time,
        signals: {
          rsi: { value: rsi, threshold: signal.type === 'BUY' ? 35 : 65 },
          macd: { value: macd.macd, signal: macd.signal },
          volatility,
          session: { hour: exchangeHour, market: exchange.name },
          position: {
            size: calculatePositionSize(currentCandle.close),
            risk: config.riskPerTrade,
            takeProfitLevel: config.takeProfitLevel ?? defaults.takeProfitLevel,
            stopLossLevel: config.stopLossLevel ?? defaults.stopLossLevel,
          },
        },
      };
      continue;
    }

    if (position) {
      const positionSignal = position.signals.position as { size?: number; risk?: number; takeProfitLevel?: number; stopLossLevel?: number } | undefined;
      const timeInTrade = (currentCandle.time.getTime() - position.entryTime.getTime()) / (1000 * 60 * 60);
      const positionSize = positionSignal?.size ?? 1;
      const currentPnL = ((position.type === 'BUY'
        ? currentCandle.close - position.entryPrice
        : position.entryPrice - currentCandle.close) * positionSize);
      const pnlPercentage = currentPnL / (position.entryPrice * positionSize);
      const defaults = strategy.defaultConfig;
      const takeProfitThreshold = ((positionSignal?.takeProfitLevel ?? config.takeProfitLevel ?? defaults.takeProfitLevel) / 100);
      const stopLossThreshold = ((positionSignal?.stopLossLevel ?? config.stopLossLevel ?? defaults.stopLossLevel) / 100);
      const shouldExit = timeInTrade >= config.maxTradeTime ||
        pnlPercentage >= takeProfitThreshold ||
        pnlPercentage <= -stopLossThreshold ||
        (position.type === 'BUY' ? signal.type === 'SELL' : signal.type === 'BUY');

      if (shouldExit) {
        trades.push({
          type: position.type,
          entryPrice: position.entryPrice,
          entryTime: position.entryTime,
          exitPrice: currentCandle.close,
          exitTime: currentCandle.time,
          profit: currentPnL,
          signals: {
            ...position.signals,
            position: {
              size: positionSize,
              risk: positionSignal?.risk ?? config.riskPerTrade,
              takeProfitLevel: positionSignal?.takeProfitLevel ?? config.takeProfitLevel ?? defaults.takeProfitLevel,
              stopLossLevel: positionSignal?.stopLossLevel ?? config.stopLossLevel ?? defaults.stopLossLevel,
            },
          },
          reason: signal.reason,
        });

        balance += currentPnL;
        lastTradeExitTime = currentCandle.time;
        position = null;
      }
    }
  }

  const winningTrades = trades.filter((trade) => trade.profit > 0);
  const losingTrades = trades.filter((trade) => trade.profit <= 0);
  const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0));

  return {
    finalBalance: balance,
    trades,
    metrics: {
      winRate: trades.length === 0 ? 0 : (winningTrades.length / trades.length) * 100,
      averageWin: winningTrades.length === 0 ? 0 : grossProfit / winningTrades.length,
      averageLoss: losingTrades.length === 0 ? 0 : losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length,
      maxDrawdown: calculateMaxDrawdown(config.initialBalance, trades),
      profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
    },
  };
};