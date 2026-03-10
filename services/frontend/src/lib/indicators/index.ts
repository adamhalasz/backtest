import { Candle } from '@/lib/types';

export function calculateRSI(candles: Candle[], index: number): number {
  const period = 14;
  if (index < period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = index - period + 1; i <= index; i++) {
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

export function calculateMACD(candles: Candle[], index: number): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const fastPeriod = 12;
  const slowPeriod = 26;
  const signalPeriod = 9;

  if (index < slowPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const fastEMA = calculateEMA(candles, index, fastPeriod);
  const slowEMA = calculateEMA(candles, index, slowPeriod);
  const macdLine = fastEMA - slowEMA;

  const macdValues = [];
  for (let i = Math.max(0, index - signalPeriod + 1); i <= index; i++) {
    const fastEMA = calculateEMA(candles, i, fastPeriod);
    const slowEMA = calculateEMA(candles, i, slowPeriod);
    macdValues.push(fastEMA - slowEMA);
  }

  const signalLine = calculateEMAFromValues(macdValues, signalPeriod);
  const histogram = macdLine - signalLine;

  return { macd: macdLine, signal: signalLine, histogram };
}

export function calculateEMA(
  candles: Candle[],
  index: number,
  period: number
): number {
  if (index < period) return candles[index].close;

  const multiplier = 2 / (period + 1);
  const previousEMA = calculateEMA(candles, index - 1, period);
  return (candles[index].close - previousEMA) * multiplier + previousEMA;
}

export function calculateEMAFromValues(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = values[0];

  for (let i = 1; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
  }

  return ema;
}

export function calculateBollingerBands(candles: Candle[], index: number, period = 20, stdDev = 2) {
  if (index < period) {
    return {
      upper: candles[index].close,
      middle: candles[index].close,
      lower: candles[index].close
    };
  }

  const prices = candles.slice(index - period + 1, index + 1).map(c => c.close);
  const sma = prices.reduce((sum, price) => sum + price, 0) / period;
  
  const squaredDiffs = prices.map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev)
  };
}