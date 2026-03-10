import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateEMA } from '../indicators';

export class DualMovingAverageStrategy implements Strategy {
  name = 'Dual Moving Average Strategy';
  description = 'Uses two moving averages of different periods to identify trend changes';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.EMA];
  guide = {
    overview: 'The Dual Moving Average Strategy uses two EMAs of different periods to identify trend changes and potential trading opportunities. It is particularly effective in trending markets.',
    entryRules: {
      buy: [
        'Fast EMA crosses above slow EMA',
        'Price is above both EMAs',
        'Volume confirms upward movement'
      ],
      sell: [
        'Fast EMA crosses below slow EMA',
        'Price is below both EMAs',
        'Volume confirms downward movement'
      ]
    },
    exitRules: {
      takeProfit: [
        'Price reaches next resistance level',
        'EMAs start to converge',
        'Momentum weakens'
      ],
      stopLoss: [
        'Price moves against position beyond EMAs',
        'EMAs cross in opposite direction',
        'Support/resistance level broken'
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
        'Clear market direction',
        'Normal to high volume'
      ],
      unfavorable: [
        'Sideways/ranging markets',
        'Low volume periods',
        'High volatility/choppy conditions'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 1.5% of account per trade',
      maxRiskPerTrade: '1:2 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 3:1 leverage'
    },
    commonMistakes: [
      'Trading in ranging markets',
      'Not waiting for confirmation',
      'Ignoring volume',
      'Using too tight stops'
    ],
    tips: [
      'Wait for candle close after crossover',
      'Consider overall market trend',
      'Use volume for confirmation',
      'Monitor price action near EMAs'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 50) return { type: null };

    const fastPeriod = 10;
    const slowPeriod = 50;

    const fastMA = calculateEMA(candles, index, fastPeriod);
    const slowMA = calculateEMA(candles, index, slowPeriod);
    const prevFastMA = calculateEMA(candles, index - 1, fastPeriod);
    const prevSlowMA = calculateEMA(candles, index - 1, slowPeriod);

    // Golden Cross (Fast MA crosses above Slow MA)
    if (fastMA > slowMA && prevFastMA <= prevSlowMA) {
      return {
        type: 'BUY',
        reason: 'Golden Cross: Fast MA crossed above Slow MA'
      };
    }

    // Death Cross (Fast MA crosses below Slow MA)
    if (fastMA < slowMA && prevFastMA >= prevSlowMA) {
      return {
        type: 'SELL',
        reason: 'Death Cross: Fast MA crossed below Slow MA'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.5,
      stopLossLevel: 0.7
    };
  }
}