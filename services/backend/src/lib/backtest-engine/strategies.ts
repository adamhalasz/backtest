import { calculateBollingerBands, calculateEMA, calculateMACD, calculateRSI } from './indicators';
import { EntryFrequency } from './types';
import type { Candle, StrategyDefinition, StrategySignal } from './types';

const detectPinBar = (candle: Candle): StrategySignal => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;

  if (lowerWick > body * 2 && upperWick < body) {
    return { type: 'BUY', reason: 'Bullish pin bar suggests buyer rejection of lower prices' };
  }

  if (upperWick > body * 2 && lowerWick < body) {
    return { type: 'SELL', reason: 'Bearish pin bar suggests seller rejection of higher prices' };
  }

  return { type: null };
};

const detectRsiDivergence = (candles: Candle[], index: number): StrategySignal => {
  if (index < 14) return { type: null };

  const currentPrice = candles[index].close;
  const currentRSI = calculateRSI(candles, index);

  for (let offset = 2; offset <= 5; offset += 1) {
    const priorIndex = index - offset;
    if (priorIndex < 14) break;

    const priorPrice = candles[priorIndex].close;
    const priorRSI = calculateRSI(candles, priorIndex);
    const divergenceStrength = Math.abs(currentRSI - priorRSI) / 100;

    if (currentPrice < priorPrice && currentRSI > priorRSI && divergenceStrength > 0.01) {
      return { type: 'BUY', reason: 'Bullish RSI divergence suggests downside momentum is weakening' };
    }

    if (currentPrice > priorPrice && currentRSI < priorRSI && divergenceStrength > 0.01) {
      return { type: 'SELL', reason: 'Bearish RSI divergence suggests upside momentum is weakening' };
    }
  }

  return { type: null };
};

const calculateIchimokuLines = (candles: Candle[], index: number) => {
  const toMidpoint = (period: number) => {
    const slice = candles.slice(Math.max(0, index - period + 1), index + 1);
    const high = Math.max(...slice.map((candle) => candle.high));
    const low = Math.min(...slice.map((candle) => candle.low));
    return (high + low) / 2;
  };

  return {
    tenkan: toMidpoint(9),
    kijun: toMidpoint(26),
  };
};

export const STRATEGIES: StrategyDefinition[] = [
  {
    name: 'Momentum Strategy',
    defaultFrequency: EntryFrequency.SCALPING,
    minCandles: 26,
    defaultConfig: { takeProfitLevel: 1.0, stopLossLevel: 0.4, timeframe: '5m' },
    calculateSignal(candles, index) {
      if (index < 26) return { type: null };
      const rsi = calculateRSI(candles, index);
      const macd = calculateMACD(candles, index);
      const prevMacd = calculateMACD(candles, index - 1);
      const currentPrice = candles[index].close;
      const prevPrice = candles[index - 1].close;
      const priceChange = (currentPrice - prevPrice) / prevPrice;

      if ((rsi < 40 && macd.macd > macd.signal && prevMacd.macd <= prevMacd.signal) ||
        (rsi < 45 && macd.histogram > 0 && priceChange > 0.001) ||
        (macd.macd > macd.signal && macd.histogram > prevMacd.histogram * 1.5)) {
        return { type: 'BUY', reason: 'RSI indicates oversold conditions with MACD bullish crossover' };
      }

      if ((rsi > 60 && macd.macd < macd.signal && prevMacd.macd >= prevMacd.signal) ||
        (rsi > 55 && macd.histogram < 0 && priceChange < -0.001) ||
        (macd.macd < macd.signal && macd.histogram < prevMacd.histogram * 1.5)) {
        return { type: 'SELL', reason: 'RSI indicates overbought conditions with MACD bearish crossover' };
      }

      return { type: null };
    },
  },
  {
    name: 'Mean Reversion Strategy',
    defaultFrequency: EntryFrequency.WEEKLY,
    minCandles: 20,
    defaultConfig: { takeProfitLevel: 1.0, stopLossLevel: 0.5 },
    calculateSignal(candles, index) {
      const bands = calculateBollingerBands(candles, index);
      const price = candles[index].close;
      if (price < bands.lower) return { type: 'BUY', reason: 'Price moved below the lower Bollinger Band' };
      if (price > bands.upper) return { type: 'SELL', reason: 'Price moved above the upper Bollinger Band' };
      return { type: null };
    },
  },
  {
    name: 'Trend Following Strategy',
    defaultFrequency: EntryFrequency.MONTHLY,
    minCandles: 50,
    defaultConfig: { takeProfitLevel: 2.0, stopLossLevel: 1.0 },
    calculateSignal(candles, index) {
      if (index < 50) return { type: null };
      const fastEMA = calculateEMA(candles, index, 20);
      const slowEMA = calculateEMA(candles, index, 50);
      const prevFastEMA = calculateEMA(candles, index - 1, 20);
      const prevSlowEMA = calculateEMA(candles, index - 1, 50);
      if (fastEMA > slowEMA && prevFastEMA <= prevSlowEMA) return { type: 'BUY', reason: 'Fast EMA crossed above slow EMA indicating uptrend' };
      if (fastEMA < slowEMA && prevFastEMA >= prevSlowEMA) return { type: 'SELL', reason: 'Fast EMA crossed below slow EMA indicating downtrend' };
      return { type: null };
    },
  },
  {
    name: 'Bollinger Bands Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 20,
    defaultConfig: { takeProfitLevel: 1.5, stopLossLevel: 0.8 },
    calculateSignal(candles, index) {
      const price = candles[index].close;
      const prevPrice = index > 0 ? candles[index - 1].close : price;
      const bands = calculateBollingerBands(candles, index);
      if (prevPrice >= bands.lower && price < bands.lower) return { type: 'BUY', reason: 'Price crossed below the lower Bollinger Band' };
      if (prevPrice <= bands.upper && price > bands.upper) return { type: 'SELL', reason: 'Price crossed above the upper Bollinger Band' };
      return { type: null };
    },
  },
  {
    name: 'Breakout Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 20,
    defaultConfig: { takeProfitLevel: 2.0, stopLossLevel: 1.0 },
    calculateSignal(candles, index) {
      if (index < 20) return { type: null };
      const recent = candles.slice(index - 19, index + 1);
      const recentHigh = Math.max(...recent.map((candle) => candle.high));
      const recentLow = Math.min(...recent.map((candle) => candle.low));
      const price = candles[index].close;
      if (price > recentHigh * 1.002) return { type: 'BUY', reason: 'Price broke above resistance level' };
      if (price < recentLow * 0.998) return { type: 'SELL', reason: 'Price broke below support level' };
      return { type: null };
    },
  },
  {
    name: 'Dual Moving Average Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 50,
    defaultConfig: { takeProfitLevel: 1.5, stopLossLevel: 0.7 },
    calculateSignal(candles, index) {
      if (index < 50) return { type: null };
      const fastMA = calculateEMA(candles, index, 10);
      const slowMA = calculateEMA(candles, index, 50);
      const prevFastMA = calculateEMA(candles, index - 1, 10);
      const prevSlowMA = calculateEMA(candles, index - 1, 50);
      if (fastMA > slowMA && prevFastMA <= prevSlowMA) return { type: 'BUY', reason: 'Fast moving average crossed above slow moving average' };
      if (fastMA < slowMA && prevFastMA >= prevSlowMA) return { type: 'SELL', reason: 'Fast moving average crossed below slow moving average' };
      return { type: null };
    },
  },
  {
    name: 'Grid Trading Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 20,
    defaultConfig: { takeProfitLevel: 0.5, stopLossLevel: 0.3 },
    calculateSignal(candles, index) {
      if (index < 20) return { type: null };
      const average = candles.slice(index - 19, index + 1).reduce((sum, candle) => sum + candle.close, 0) / 20;
      const price = candles[index].close;
      if (price <= average * 0.998) return { type: 'BUY', reason: 'Price reached lower grid support' };
      if (price >= average * 1.002) return { type: 'SELL', reason: 'Price reached upper grid resistance' };
      return { type: null };
    },
  },
  {
    name: 'Ichimoku Cloud Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 26,
    defaultConfig: { takeProfitLevel: 1.8, stopLossLevel: 0.9 },
    calculateSignal(candles, index) {
      if (index < 26) return { type: null };
      const current = calculateIchimokuLines(candles, index);
      const previous = calculateIchimokuLines(candles, index - 1);
      if (current.tenkan > current.kijun && previous.tenkan <= previous.kijun) return { type: 'BUY', reason: 'Tenkan crossed above Kijun' };
      if (current.tenkan < current.kijun && previous.tenkan >= previous.kijun) return { type: 'SELL', reason: 'Tenkan crossed below Kijun' };
      return { type: null };
    },
  },
  {
    name: 'Price Action Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 3,
    defaultConfig: { takeProfitLevel: 1.6, stopLossLevel: 0.8 },
    calculateSignal(candles, index) {
      return detectPinBar(candles[index]);
    },
  },
  {
    name: 'RSI Divergence Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 14,
    defaultConfig: { takeProfitLevel: 1.7, stopLossLevel: 0.8 },
    calculateSignal(candles, index) {
      return detectRsiDivergence(candles, index);
    },
  },
  {
    name: 'Scalping Strategy',
    defaultFrequency: EntryFrequency.SCALPING,
    minCandles: 10,
    defaultConfig: { takeProfitLevel: 0.3, stopLossLevel: 0.2 },
    calculateSignal(candles, index) {
      if (index < 10) return { type: null };
      const fastEMA = calculateEMA(candles, index, 5);
      const slowEMA = calculateEMA(candles, index, 10);
      const currentPrice = candles[index].close;
      const previousPrice = candles[index - 1].close;
      const momentum = (currentPrice - previousPrice) / previousPrice;
      if (momentum > 0.001 && currentPrice > fastEMA && fastEMA > slowEMA) return { type: 'BUY', reason: 'Short-term momentum and moving averages aligned bullish' };
      if (momentum < -0.001 && currentPrice < fastEMA && fastEMA < slowEMA) return { type: 'SELL', reason: 'Short-term momentum and moving averages aligned bearish' };
      return { type: null };
    },
  },
  {
    name: 'Swing Trading Strategy',
    defaultFrequency: EntryFrequency.WEEKLY,
    minCandles: 26,
    defaultConfig: { takeProfitLevel: 2.5, stopLossLevel: 1.2 },
    calculateSignal(candles, index) {
      if (index < 26) return { type: null };
      const rsi = calculateRSI(candles, index);
      const macd = calculateMACD(candles, index);
      const prevMacd = calculateMACD(candles, index - 1);
      if (rsi < 40 && macd.macd > macd.signal && prevMacd.macd <= prevMacd.signal) return { type: 'BUY', reason: 'Bullish MACD crossover with depressed RSI' };
      if (rsi > 60 && macd.macd < macd.signal && prevMacd.macd >= prevMacd.signal) return { type: 'SELL', reason: 'Bearish MACD crossover with elevated RSI' };
      return { type: null };
    },
  },
  {
    name: 'Volume Weighted Strategy',
    defaultFrequency: EntryFrequency.DAILY,
    minCandles: 20,
    defaultConfig: { takeProfitLevel: 1.4, stopLossLevel: 0.7 },
    calculateSignal(candles, index) {
      if (index < 20) return { type: null };
      const slice = candles.slice(index - 19, index + 1);
      const totals = slice.reduce((state, candle) => {
        const typicalPrice = (candle.high + candle.low + candle.close) / 3;
        return {
          pv: state.pv + typicalPrice * candle.volume,
          volume: state.volume + candle.volume,
        };
      }, { pv: 0, volume: 0 });
      const vwap = totals.volume === 0 ? candles[index].close : totals.pv / totals.volume;
      const currentPrice = candles[index].close;
      const currentVolume = candles[index].volume;
      const avgVolume = candles.slice(index - 20, index).reduce((sum, candle) => sum + candle.volume, 0) / 20;
      if (currentPrice > vwap && currentVolume > avgVolume * 1.5) return { type: 'BUY', reason: 'High volume breakout above VWAP' };
      if (currentPrice < vwap && currentVolume > avgVolume * 1.5) return { type: 'SELL', reason: 'High volume breakdown below VWAP' };
      return { type: null };
    },
  },
];

export const getStrategy = (strategyName: string) => {
  return STRATEGIES.find((strategy) => strategy.name === strategyName);
};