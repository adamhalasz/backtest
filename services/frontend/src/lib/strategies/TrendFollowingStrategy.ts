import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateEMA } from '../indicators';

export class TrendFollowingStrategy implements Strategy {
  name = 'Trend Following Strategy';
  description = 'Uses moving average crossovers to identify and follow market trends';
  defaultFrequency = EntryFrequency.MONTHLY; // Monthly trading by default
  indicators = [Indicator.EMA, Indicator.PRICE_ACTION];
  guide = {
    overview: 'The Trend Following Strategy is designed to capture major market moves by identifying and following established trends. It uses moving average crossovers and price action analysis to determine trend direction and momentum.',
    entryRules: {
      buy: [
        'Fast EMA crosses above slow EMA',
        'Price is above both EMAs',
        'Previous swing low forms higher low'
      ],
      sell: [
        'Fast EMA crosses below slow EMA',
        'Price is below both EMAs',
        'Previous swing high forms lower high'
      ]
    },
    exitRules: {
      takeProfit: [
        'Trailing stop based on ATR',
        'Moving average crossover in opposite direction',
        'Price reaches major resistance/support level'
      ],
      stopLoss: [
        'Below recent swing low for longs',
        'Above recent swing high for shorts',
        'When price closes beyond the slow EMA'
      ]
    },
    bestTimeframes: [
      'Primary: Daily chart for signal generation',
      'Secondary: 4-hour chart for entry timing',
      'Higher: Weekly chart for trend confirmation'
    ],
    marketConditions: {
      favorable: [
        'Strong directional trends',
        'Low to moderate volatility',
        'Clear market structure'
      ],
      unfavorable: [
        'Choppy, sideways markets',
        'Excessive volatility',
        'Multiple trend reversals'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 2% of account per trade',
      maxRiskPerTrade: '1:2.5 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 2:1 leverage'
    },
    commonMistakes: [
      'Trying to pick tops and bottoms',
      'Not waiting for trend confirmation',
      'Overtrading in ranging markets',
      'Using too tight stops in trending markets'
    ],
    tips: [
      'Focus on high-probability trend continuation setups',
      'Use multiple timeframe analysis',
      'Let profits run in strong trends',
      'Scale into positions as trend develops'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 50) return { type: null };

    const fastEMA = calculateEMA(candles, index, 20);
    const slowEMA = calculateEMA(candles, index, 50);
    const prevFastEMA = calculateEMA(candles, index - 1, 20);
    const prevSlowEMA = calculateEMA(candles, index - 1, 50);

    if (fastEMA > slowEMA && prevFastEMA <= prevSlowEMA) {
      return {
        type: 'BUY',
        reason: 'Fast EMA crossed above slow EMA indicating uptrend'
      };
    }

    if (fastEMA < slowEMA && prevFastEMA >= prevSlowEMA) {
      return {
        type: 'SELL',
        reason: 'Fast EMA crossed below slow EMA indicating downtrend'
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