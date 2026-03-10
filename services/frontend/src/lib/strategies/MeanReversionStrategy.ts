import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateBollingerBands } from '../indicators';

export class MeanReversionStrategy implements Strategy {
  name = 'Mean Reversion Strategy';
  description = 'Uses Bollinger Bands to identify overbought and oversold conditions';
  defaultFrequency = EntryFrequency.WEEKLY; // Weekly trading by default
  indicators = [Indicator.BOLLINGER, Indicator.PRICE_ACTION];
  guide = {
    overview: 'The Mean Reversion Strategy capitalizes on price movements that deviate significantly from the average, expecting a return to the mean. It uses Bollinger Bands to identify extreme price levels.',
    entryRules: {
      buy: [
        'Price touches or breaks below lower Bollinger Band',
        'RSI confirms oversold conditions',
        'Price forms bullish candlestick pattern'
      ],
      sell: [
        'Price touches or breaks above upper Bollinger Band',
        'RSI confirms overbought conditions',
        'Price forms bearish candlestick pattern'
      ]
    },
    exitRules: {
      takeProfit: [
        'Price reaches middle Bollinger Band',
        'RSI returns to neutral zone (40-60)',
        'Target profit level reached'
      ],
      stopLoss: [
        'Price continues beyond Bollinger Band with strong momentum',
        'Break of local support/resistance level',
        'Maximum drawdown level reached'
      ]
    },
    bestTimeframes: [
      'Primary: 4-hour chart for signal generation',
      'Secondary: 1-hour chart for entry timing',
      'Higher: Daily chart for trend context'
    ],
    marketConditions: {
      favorable: [
        'Range-bound markets',
        'Clear support and resistance levels',
        'Normal volatility conditions'
      ],
      unfavorable: [
        'Strong trending markets',
        'Breakout conditions',
        'News-driven volatile markets'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 1.5% of account per trade',
      maxRiskPerTrade: '1:1.5 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 3:1 leverage'
    },
    commonMistakes: [
      'Trading against strong trends',
      'Not waiting for confirmation signals',
      'Holding positions too long',
      'Ignoring market volatility conditions'
    ],
    tips: [
      'Look for additional confirmation from other indicators',
      'Consider market sentiment before entry',
      'Use smaller position sizes during high volatility',
      'Monitor correlation with broader market trends'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 20) return { type: null };

    const bb = calculateBollingerBands(candles, index);
    const currentPrice = candles[index].close;

    if (currentPrice < bb.lower) {
      return {
        type: 'BUY',
        reason: 'Price below lower Bollinger Band indicates oversold conditions'
      };
    }

    if (currentPrice > bb.upper) {
      return {
        type: 'SELL',
        reason: 'Price above upper Bollinger Band indicates overbought conditions'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 1.0,
      stopLossLevel: 0.5
    };
  }
}