import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';

export class PriceActionStrategy implements Strategy {
  name = 'Price Action Strategy';
  description = 'Analyzes candlestick patterns and price structures to identify trading opportunities';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.PRICE_ACTION];
  guide = {
    overview: 'The Price Action Strategy focuses on raw price movements and candlestick patterns to identify high-probability trading opportunities. It relies on understanding market structure and price behavior without the need for complex indicators.',
    entryRules: {
      buy: [
        'Bullish candlestick patterns',
        'Support level holds',
        'Higher lows forming'
      ],
      sell: [
        'Bearish candlestick patterns',
        'Resistance level holds',
        'Lower highs forming'
      ]
    },
    exitRules: {
      takeProfit: [
        'Price reaches major resistance',
        'Reversal pattern forms',
        'Target level achieved'
      ],
      stopLoss: [
        'Below key support for longs',
        'Above key resistance for shorts',
        'Pattern invalidation'
      ]
    },
    bestTimeframes: [
      'Primary: 4-hour chart for pattern identification',
      'Secondary: 1-hour chart for entry timing',
      'Higher: Daily chart for trend context'
    ],
    marketConditions: {
      favorable: [
        'Clear market structure',
        'Strong support/resistance',
        'Clean price action'
      ],
      unfavorable: [
        'Choppy price action',
        'Unclear market structure',
        'Low volume periods'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 1.5% of account per trade',
      maxRiskPerTrade: '1:2 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 3:1 leverage'
    },
    commonMistakes: [
      'Over-trading weak patterns',
      'Ignoring market context',
      'Not waiting for confirmation',
      'Poor stop placement'
    ],
    tips: [
      'Focus on clean price action',
      'Wait for pattern completion',
      'Consider market structure',
      'Use multiple timeframe analysis'
    ]
  };

  private isPinBar(candle: Candle): { isPinBar: boolean; direction: 'up' | 'down' | null } {
    const bodySize = Math.abs(candle.close - candle.open);
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    const totalSize = candle.high - candle.low;

    if (totalSize === 0) return { isPinBar: false, direction: null };

    const bodyRatio = bodySize / totalSize;
    const upperWickRatio = upperWick / totalSize;
    const lowerWickRatio = lowerWick / totalSize;

    if (bodyRatio < 0.3) { // Small body
      if (upperWickRatio > 0.6) return { isPinBar: true, direction: 'down' }; // Long upper wick
      if (lowerWickRatio > 0.6) return { isPinBar: true, direction: 'up' }; // Long lower wick
    }

    return { isPinBar: false, direction: null };
  }

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 3) return { type: null };

    const currentCandle = candles[index];
    const { isPinBar, direction } = this.isPinBar(currentCandle);

    if (isPinBar) {
      if (direction === 'up') {
        return {
          type: 'BUY',
          reason: 'Bullish pin bar detected'
        };
      }
      if (direction === 'down') {
        return {
          type: 'SELL',
          reason: 'Bearish pin bar detected'
        };
      }
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.6,
      stopLossLevel: 0.8
    };
  }
}