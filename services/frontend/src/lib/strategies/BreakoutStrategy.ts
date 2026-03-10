import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';

export class BreakoutStrategy implements Strategy {
  name = 'Breakout Strategy';
  description = 'Identifies and trades breakouts from key support and resistance levels';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.PRICE_ACTION, Indicator.VOLUME];
  guide = {
    overview: 'The Breakout Strategy aims to capture significant price movements that occur when key support or resistance levels are breached. It relies heavily on volume confirmation and price action analysis.',
    entryRules: {
      buy: [
        'Price breaks above key resistance',
        'Volume confirms breakout',
        'Previous resistance becomes support'
      ],
      sell: [
        'Price breaks below key support',
        'Volume confirms breakdown',
        'Previous support becomes resistance'
      ]
    },
    exitRules: {
      takeProfit: [
        'Next major resistance level',
        'Measured move target reached',
        'Momentum weakens significantly'
      ],
      stopLoss: [
        'Below breakout level for longs',
        'Above breakdown level for shorts',
        'When volume dries up'
      ]
    },
    bestTimeframes: [
      'Primary: 4-hour chart for level identification',
      'Secondary: 1-hour chart for entry timing',
      'Higher: Daily chart for major levels'
    ],
    marketConditions: {
      favorable: [
        'Clear support/resistance levels',
        'High volume environment',
        'Strong market sentiment'
      ],
      unfavorable: [
        'Choppy, directionless markets',
        'Low volume periods',
        'Multiple failed breakouts'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 2% of account per trade',
      maxRiskPerTrade: '1:3 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 4:1 leverage'
    },
    commonMistakes: [
      'Chasing false breakouts',
      'Not waiting for confirmation',
      'Ignoring volume analysis',
      'Poor stop placement'
    ],
    tips: [
      'Wait for candle close beyond level',
      'Use volume for confirmation',
      'Consider market context',
      'Look for price action signals'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 20) return { type: null };

    const period = 20;
    const currentPrice = candles[index].close;
    
    // Calculate recent high and low
    const recentPrices = candles.slice(index - period + 1, index + 1);
    const recentHigh = Math.max(...recentPrices.map(c => c.high));
    const recentLow = Math.min(...recentPrices.map(c => c.low));

    // Breakout above resistance
    if (currentPrice > recentHigh * 1.002) { // 0.2% breakout threshold
      return {
        type: 'BUY',
        reason: 'Price broke above resistance level'
      };
    }

    // Breakdown below support
    if (currentPrice < recentLow * 0.998) { // 0.2% breakdown threshold
      return {
        type: 'SELL',
        reason: 'Price broke below support level'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 2.0,
      stopLossLevel: 1.0
    };
  }
}