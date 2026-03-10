import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';

export class VolumeWeightedStrategy implements Strategy {
  name = 'Volume Weighted Strategy';
  description = 'Uses volume analysis to identify high-probability trading opportunities';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.VWAP, Indicator.VOLUME];
  guide = {
    overview: 'The Volume Weighted Strategy uses volume analysis and VWAP to identify high-probability trading opportunities. It focuses on price movements supported by significant volume.',
    entryRules: {
      buy: [
        'Price breaks above VWAP with high volume',
        'Volume increasing on upward moves',
        'Previous resistance broken with volume'
      ],
      sell: [
        'Price breaks below VWAP with high volume',
        'Volume increasing on downward moves',
        'Previous support broken with volume'
      ]
    },
    exitRules: {
      takeProfit: [
        'Volume declining at extreme levels',
        'Price reaches major level with low volume',
        'VWAP deviation becomes extreme'
      ],
      stopLoss: [
        'High volume move against position',
        'VWAP crossed with strong volume',
        'Key level broken with volume'
      ]
    },
    bestTimeframes: [
      'Primary: 1-hour chart for volume analysis',
      'Secondary: 15-minute chart for entry timing',
      'Higher: 4-hour chart for trend context'
    ],
    marketConditions: {
      favorable: [
        'High volume environments',
        'Clear price levels',
        'Strong market participation'
      ],
      unfavorable: [
        'Low volume periods',
        'Holiday markets',
        'Pre-news conditions'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 1.5% of account per trade',
      maxRiskPerTrade: '1:2 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 3:1 leverage'
    },
    commonMistakes: [
      'Ignoring volume context',
      'Trading in low volume',
      'Not confirming price levels',
      'Over-leveraging positions'
    ],
    tips: [
      'Focus on volume confirmation',
      'Wait for clear signals',
      'Monitor volume trends',
      'Consider market hours'
    ]
  };

  private calculateVWAP(candles: Candle[], index: number): number {
    const period = 20;
    const start = Math.max(0, index - period + 1);
    let sumPV = 0;
    let sumV = 0;

    for (let i = start; i <= index; i++) {
      const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
      sumPV += typicalPrice * candles[i].volume;
      sumV += candles[i].volume;
    }

    return sumPV / sumV;
  }

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 20) return { type: null };

    const vwap = this.calculateVWAP(candles, index);
    const currentPrice = candles[index].close;
    const currentVolume = candles[index].volume;
    const avgVolume = candles
      .slice(index - 20, index)
      .reduce((sum, c) => sum + c.volume, 0) / 20;

    // High volume breakout above VWAP
    if (currentPrice > vwap && currentVolume > avgVolume * 1.5) {
      return {
        type: 'BUY',
        reason: 'High volume breakout above VWAP'
      };
    }

    // High volume breakdown below VWAP
    if (currentPrice < vwap && currentVolume > avgVolume * 1.5) {
      return {
        type: 'SELL',
        reason: 'High volume breakdown below VWAP'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.4,
      stopLossLevel: 0.7
    };
  }
}