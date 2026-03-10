import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateRSI, calculateMACD } from '../indicators';

export class MomentumStrategy implements Strategy {
  name = 'Momentum Strategy';
  description = 'Combines RSI and MACD indicators to identify momentum shifts in the market';
  defaultFrequency = EntryFrequency.SCALPING;
  indicators = [Indicator.RSI, Indicator.MACD];
  guide = {
    overview: 'The Momentum Strategy is designed to capture strong price movements by combining RSI and MACD indicators. It excels in trending markets where price shows clear directional bias.',
    entryRules: {
      buy: [
        'RSI drops below 35 (oversold)',
        'MACD line crosses above signal line',
        'Price shows higher lows on lower timeframe'
      ],
      sell: [
        'RSI rises above 65 (overbought)',
        'MACD line crosses below signal line',
        'Price shows lower highs on lower timeframe'
      ]
    },
    exitRules: {
      takeProfit: [
        'RSI reaches overbought zone for buys',
        'RSI reaches oversold zone for sells',
        'Price reaches major resistance/support level'
      ],
      stopLoss: [
        'Below recent swing low for buys',
        'Above recent swing high for sells',
        'When RSI shows divergence against position'
      ]
    },
    bestTimeframes: [
      'Primary: 1-hour chart for signal generation',
      'Secondary: 15-minute chart for entry timing',
      'Higher: 4-hour chart for trend confirmation'
    ],
    marketConditions: {
      favorable: [
        'Strong trending markets',
        'High volatility environments',
        'Clear market direction'
      ],
      unfavorable: [
        'Ranging/sideways markets',
        'Low volatility periods',
        'Choppy price action'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 2% of account per trade',
      maxRiskPerTrade: '1:2 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 5:1 leverage'
    },
    commonMistakes: [
      'Entering against the main trend',
      'Ignoring major support/resistance levels',
      'Not waiting for MACD confirmation',
      'Trading during low volatility periods'
    ],
    tips: [
      'Always trade in the direction of the higher timeframe trend',
      'Use volume to confirm momentum',
      'Wait for candle closure before entry',
      'Reduce position size during uncertain market conditions'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 26) return { type: null };

    // Calculate indicators
    const rsi = calculateRSI(candles, index);
    const macd = calculateMACD(candles, index);
    const prevMacd = calculateMACD(candles, index - 1);
    const currentPrice = candles[index].close;
    const prevPrice = candles[index - 1].close;
    const priceChange = (currentPrice - prevPrice) / prevPrice;

    // Buy signals (more sensitive conditions)
    if ((rsi < 40 && macd.macd > macd.signal && prevMacd.macd <= prevMacd.signal) || // RSI oversold with MACD crossover
        (rsi < 45 && macd.histogram > 0 && priceChange > 0.001) || // RSI relatively low with positive momentum
        (macd.macd > macd.signal && macd.histogram > prevMacd.histogram * 1.5)) { // Strong MACD momentum
      return {
        type: 'BUY',
        reason: 'RSI indicates oversold conditions with MACD bullish crossover'
      };
    }

    // Sell signals (more sensitive conditions)
    if ((rsi > 60 && macd.macd < macd.signal && prevMacd.macd >= prevMacd.signal) || // RSI overbought with MACD crossover
        (rsi > 55 && macd.histogram < 0 && priceChange < -0.001) || // RSI relatively high with negative momentum
        (macd.macd < macd.signal && macd.histogram < prevMacd.histogram * 1.5)) { // Strong MACD momentum
      return {
        type: 'SELL',
        reason: 'RSI indicates overbought conditions with MACD bearish crossover'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.0,
      stopLossLevel: 0.4,
      timeframe: '5m'
    };
  }
}