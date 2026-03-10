import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateBollingerBands } from '../indicators';

export class BollingerBandsStrategy implements Strategy {
  name = 'Bollinger Bands Strategy';
  description = 'Uses Bollinger Bands to identify market volatility and potential price reversals';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.BOLLINGER, Indicator.PRICE_ACTION];
  guide = {
    overview: 'The Bollinger Bands Strategy uses standard deviation to create dynamic support and resistance levels. It excels in both trending and ranging markets by adapting to volatility.',
    entryRules: {
      buy: [
        'Price touches or breaks below lower band',
        'RSI confirms oversold conditions',
        'Volume increases on bounce'
      ],
      sell: [
        'Price touches or breaks above upper band',
        'RSI confirms overbought conditions',
        'Volume increases on reversal'
      ]
    },
    exitRules: {
      takeProfit: [
        'Price reaches middle band',
        'Opposite band touched',
        'Target profit achieved'
      ],
      stopLoss: [
        'Price moves beyond band with momentum',
        'Band width expands rapidly',
        'Maximum loss threshold reached'
      ]
    },
    bestTimeframes: [
      'Primary: 1-hour chart for signal generation',
      'Secondary: 15-minute chart for entry timing',
      'Higher: 4-hour chart for trend context'
    ],
    marketConditions: {
      favorable: [
        'Normal to high volatility',
        'Clear price channels',
        'Trending or ranging markets'
      ],
      unfavorable: [
        'Extremely low volatility',
        'Major news events',
        'Choppy price action'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 1% of account per trade',
      maxRiskPerTrade: '1:2 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 3:1 leverage'
    },
    commonMistakes: [
      'Treating bands as absolute levels',
      'Ignoring overall trend direction',
      'Not considering volatility changes',
      'Taking signals in low liquidity'
    ],
    tips: [
      'Use multiple timeframe analysis',
      'Consider volume confirmation',
      'Adjust band settings for volatility',
      'Wait for candle closure'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 20) return { type: null };

    const bb = calculateBollingerBands(candles, index);
    const currentPrice = candles[index].close;
    const prevPrice = candles[index - 1].close;

    // Price crossing below lower band with upward momentum
    if (currentPrice < bb.lower && prevPrice > bb.lower) {
      return {
        type: 'BUY',
        reason: 'Price crossed below lower Bollinger Band'
      };
    }

    // Price crossing above upper band with downward momentum
    if (currentPrice > bb.upper && prevPrice < bb.upper) {
      return {
        type: 'SELL',
        reason: 'Price crossed above upper Bollinger Band'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.5,
      stopLossLevel: 0.8
    };
  }
}