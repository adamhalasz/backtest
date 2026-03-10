import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';

export class IchimokuStrategy implements Strategy {
  name = 'Ichimoku Cloud Strategy';
  description = 'Uses the Ichimoku Cloud system to identify trend direction and potential reversals';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.ICHIMOKU];
  guide = {
    overview: 'The Ichimoku Cloud Strategy is a comprehensive trading system that provides information about trend direction, momentum, and potential support/resistance levels. It excels in identifying major trend changes and strong continuation moves.',
    entryRules: {
      buy: [
        'Price above the Cloud',
        'Tenkan-sen crosses above Kijun-sen',
        'Chikou Span above price'
      ],
      sell: [
        'Price below the Cloud',
        'Tenkan-sen crosses below Kijun-sen',
        'Chikou Span below price'
      ]
    },
    exitRules: {
      takeProfit: [
        'Price reaches opposite side of Cloud',
        'Tenkan/Kijun cross in opposite direction',
        'Strong resistance/support reached'
      ],
      stopLoss: [
        'Price moves through Cloud in opposite direction',
        'Chikou Span crosses price',
        'Key support/resistance broken'
      ]
    },
    bestTimeframes: [
      'Primary: Daily chart for major signals',
      'Secondary: 4-hour chart for entry timing',
      'Higher: Weekly chart for trend confirmation'
    ],
    marketConditions: {
      favorable: [
        'Strong trending markets',
        'Clear market direction',
        'Normal to high volume'
      ],
      unfavorable: [
        'Choppy price action',
        'Price within the Cloud',
        'Low volume conditions'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 2% of account per trade',
      maxRiskPerTrade: '1:2 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 3:1 leverage'
    },
    commonMistakes: [
      'Trading within the Cloud',
      'Ignoring Chikou Span',
      'Not waiting for confirmation',
      'Over-complicating the system'
    ],
    tips: [
      'Wait for clear Cloud breakouts',
      'Use multiple timeframe analysis',
      'Consider all Ichimoku components',
      'Be patient for strong setups'
    ]
  };

  private calculateTenkan(candles: Candle[], index: number): number {
    const period = 9;
    const slice = candles.slice(Math.max(0, index - period + 1), index + 1);
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    return (high + low) / 2;
  }

  private calculateKijun(candles: Candle[], index: number): number {
    const period = 26;
    const slice = candles.slice(Math.max(0, index - period + 1), index + 1);
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    return (high + low) / 2;
  }

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 26) return { type: null };

    const tenkan = this.calculateTenkan(candles, index);
    const kijun = this.calculateKijun(candles, index);
    const prevTenkan = this.calculateTenkan(candles, index - 1);
    const prevKijun = this.calculateKijun(candles, index - 1);

    // Tenkan crosses above Kijun (bullish)
    if (tenkan > kijun && prevTenkan <= prevKijun) {
      return {
        type: 'BUY',
        reason: 'Tenkan-sen crossed above Kijun-sen'
      };
    }

    // Tenkan crosses below Kijun (bearish)
    if (tenkan < kijun && prevTenkan >= prevKijun) {
      return {
        type: 'SELL',
        reason: 'Tenkan-sen crossed below Kijun-sen'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.8,
      stopLossLevel: 0.9
    };
  }
}