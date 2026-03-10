import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateRSI } from '../indicators';

export class RSIDivergenceStrategy implements Strategy {
  name = 'RSI Divergence Strategy';
  description = 'Identifies divergences between price and RSI to predict potential reversals';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.RSI];
  guide = {
    overview: 'The RSI Divergence Strategy identifies discrepancies between price action and RSI readings to predict potential market reversals. It is particularly effective in catching major trend reversals and price corrections.',
    entryRules: {
      buy: [
        'Price makes lower low while RSI makes higher low',
        'RSI below 30 (oversold)',
        'Volume confirms reversal'
      ],
      sell: [
        'Price makes higher high while RSI makes lower high',
        'RSI above 70 (overbought)',
        'Volume confirms reversal'
      ]
    },
    exitRules: {
      takeProfit: [
        'RSI reaches opposite extreme',
        'Price reaches major level',
        'Divergence resolves'
      ],
      stopLoss: [
        'Divergence invalidation',
        'New extreme in opposite direction',
        'Key support/resistance broken'
      ]
    },
    bestTimeframes: [
      'Primary: 4-hour chart for divergence scanning',
      'Secondary: 1-hour chart for entry timing',
      'Higher: Daily chart for major divergences'
    ],
    marketConditions: {
      favorable: [
        'Strong trends nearing exhaustion',
        'Clear price extremes',
        'Obvious divergences'
      ],
      unfavorable: [
        'Ranging markets',
        'Weak trends',
        'Multiple false signals'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 1.5% of account per trade',
      maxRiskPerTrade: '1:2 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 2:1 leverage'
    },
    commonMistakes: [
      'Trading minor divergences',
      'Ignoring market context',
      'Not waiting for confirmation',
      'Poor stop placement'
    ],
    tips: [
      'Focus on strong divergences',
      'Wait for price confirmation',
      'Consider trend strength',
      'Use multiple timeframe analysis'
    ]
  };

  private findDivergence(candles: Candle[], index: number): { type: 'bullish' | 'bearish' | null; strength: number } {
    if (index < 14) return { type: null, strength: 0 };

    const lookback = 5;
    const currentPrice = candles[index].close;
    const currentRSI = calculateRSI(candles, index);
    
    let priceHigher = false;
    let rsiHigher = false;
    let divergenceStrength = 0;

    for (let i = 1; i <= lookback; i++) {
      const pastPrice = candles[index - i].close;
      const pastRSI = calculateRSI(candles, index - i);

      priceHigher = currentPrice > pastPrice;
      rsiHigher = currentRSI > pastRSI;

      if (priceHigher !== rsiHigher) {
        divergenceStrength = Math.abs(currentPrice - pastPrice) / pastPrice;
        if (priceHigher && !rsiHigher) return { type: 'bearish', strength: divergenceStrength };
        if (!priceHigher && rsiHigher) return { type: 'bullish', strength: divergenceStrength };
      }
    }

    return { type: null, strength: 0 };
  }

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 14) return { type: null };

    const divergence = this.findDivergence(candles, index);
    
    if (divergence.type === 'bullish' && divergence.strength > 0.01) {
      return {
        type: 'BUY',
        reason: 'Bullish RSI divergence detected'
      };
    }

    if (divergence.type === 'bearish' && divergence.strength > 0.01) {
      return {
        type: 'SELL',
        reason: 'Bearish RSI divergence detected'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.7,
      stopLossLevel: 0.8
    };
  }
}