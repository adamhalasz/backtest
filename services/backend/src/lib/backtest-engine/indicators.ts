import type { Candle } from './types';

export function calculateRSI(candles: Candle[], index: number, period: number = 14): number {
  if (index < period) return 50;

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

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateEMA(candles: Candle[], index: number, period: number): number {
  if (index < period) return candles[index].close;

  const multiplier = 2 / (period + 1);
  const previousEMA = calculateEMA(candles, index - 1, period);
  return (candles[index].close - previousEMA) * multiplier + previousEMA;
}

export function calculateEMAFromValues(values: number[], period: number): number {
  if (values.length === 0) return 0;
  if (values.length < period) return values[values.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = values[0];

  for (let i = 1; i < values.length; i += 1) {
    ema = (values[i] - ema) * multiplier + ema;
  }

  return ema;
}

export function calculateMACD(candles: Candle[], index: number) {
  const fastPeriod = 12;
  const slowPeriod = 26;
  const signalPeriod = 9;

  if (index < slowPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const fastEMA = calculateEMA(candles, index, fastPeriod);
  const slowEMA = calculateEMA(candles, index, slowPeriod);
  const macdLine = fastEMA - slowEMA;

  const macdValues: number[] = [];
  for (let i = Math.max(0, index - signalPeriod + 1); i <= index; i += 1) {
    const periodFastEMA = calculateEMA(candles, i, fastPeriod);
    const periodSlowEMA = calculateEMA(candles, i, slowPeriod);
    macdValues.push(periodFastEMA - periodSlowEMA);
  }

  const signalLine = calculateEMAFromValues(macdValues, signalPeriod);

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

export function calculateBollingerBands(candles: Candle[], index: number, period = 20, stdDev = 2) {
  if (index < period) {
    const close = candles[index].close;
    return { upper: close, middle: close, lower: close };
  }

  const slice = candles.slice(index - period + 1, index + 1);
  const closes = slice.map((candle) => candle.close);
  const middle = closes.reduce((sum, value) => sum + value, 0) / closes.length;
  const variance = closes.reduce((sum, value) => sum + (value - middle) ** 2, 0) / closes.length;
  const deviation = Math.sqrt(variance);

  return {
    upper: middle + deviation * stdDev,
    middle,
    lower: middle - deviation * stdDev,
  };
}