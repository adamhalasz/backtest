import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateRSI, calculateMACD } from '../indicators';

export class SwingTradingStrategy implements Strategy {
  name = 'Swing Trading Strategy';
  description = 'Captures medium-term price movements using multiple technical indicators';
  defaultFrequency = EntryFrequency.WEEKLY;
  indicators = [Indicator.RSI, Indicator.MACD];
  guide = {
    overview: 'The Swing Trading Strategy aims to capture medium-term price movements lasting several days to weeks. It combines multiple technical indicators to identify high-probability trading opportunities.',
    entryRules: {
      buy: [
        'RSI below 40 (oversold)',
        'MACD bullish crossover',
        'Price above key moving average'
      ],
      sell: [
        'RSI above 60 (overbought)',
        'MACD bearish crossover',
        'Price below key moving average'
      ]
    },
    exitRules: {
      takeProfit: [
        'RSI reaches opposite extreme',
        'MACD divergence appears',
        'Major resistance/support reached'
      ],
      stopLoss: [
        'Below recent swing low for longs',
        'Above recent swing high for shorts',
        'Moving average broken with momentum'
      ]
    },
    bestTimeframes: [
      'Primary: Daily chart for signal generation',
      'Secondary: 4-hour chart for entry timing',
      'Higher: Weekly chart for trend context'
    ],
    marketConditions: {
      favorable: [
        'Clear market structure',
        'Defined trends',
        'Normal volatility'
      ],
      unfavorable: [
        'Choppy price action',
        'Extremely low volatility',
        'Major news events'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 2% of account per trade',
      maxRiskPerTrade: '1:2.5 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 2:1 leverage'
    },
    commonMistakes: [
      'Not giving trades enough room',
      'Taking too many positions',
      'Ignoring market context',
      'Poor position sizing'
    ],
    tips: [
      'Focus on strong setups only',
      'Use multiple timeframe analysis',
      'Consider correlation between positions',
      'Monitor overall market conditions'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 26) return { type: null };

    const rsi = calculateRSI(candles, index);
    const macd = calculateMACD(candles, index);
    const prevMACD = calculateMACD(candles, index - 1);

    // Bullish conditions
    if (
      rsi < 40 && // Oversold
      macd.macd > macd.signal && // MACD crossover
      prevMACD.macd <= prevMACD.signal
    ) {
      return {
        type: 'BUY',
        reason: 'Oversold conditions with MACD bullish crossover'
      };
    }

    // Bearish conditions
    if (
      rsi > 60 && // Overbought
      macd.macd < macd.signal && // MACD crossover
      prevMACD.macd >= prevMACD.signal
    ) {
      return {
        type: 'SELL',
        reason: 'Overbought conditions with MACD bearish crossover'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 2.5,
      stopLossLevel: 1.2
    };
  }
}