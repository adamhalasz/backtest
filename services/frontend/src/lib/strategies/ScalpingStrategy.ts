import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';
import { calculateEMA } from '../indicators';

export class ScalpingStrategy implements Strategy {
  name = 'Scalping Strategy';
  description = 'Takes advantage of small price movements with quick entries and exits';
  defaultFrequency = EntryFrequency.SCALPING;
  indicators = [Indicator.EMA, Indicator.PRICE_ACTION];
  guide = {
    overview: 'The Scalping Strategy aims to profit from small price movements by making multiple trades throughout the day. It relies on quick decision making and precise entry/exit timing.',
    entryRules: {
      buy: [
        'Price above fast EMA',
        'Strong upward momentum',
        'High volume spike'
      ],
      sell: [
        'Price below fast EMA',
        'Strong downward momentum',
        'High volume spike'
      ]
    },
    exitRules: {
      takeProfit: [
        'Small profit target reached',
        'Momentum weakens',
        'Volume decreases'
      ],
      stopLoss: [
        'Small fixed pip amount',
        'EMA crossed in opposite direction',
        'Momentum reversal'
      ]
    },
    bestTimeframes: [
      'Primary: 1-minute chart for execution',
      'Secondary: 5-minute chart for trend',
      'Higher: 15-minute chart for context'
    ],
    marketConditions: {
      favorable: [
        'High liquidity periods',
        'Clear short-term trends',
        'Normal volatility'
      ],
      unfavorable: [
        'Low liquidity periods',
        'High spread conditions',
        'Major news events'
      ]
    },
    riskManagement: {
      positionSizing: 'Maximum 0.5% of account per trade',
      maxRiskPerTrade: '1:1.5 risk-reward ratio minimum',
      recommendedLeverage: 'Maximum 5:1 leverage'
    },
    commonMistakes: [
      'Overtrading',
      'Chasing moves',
      'Not cutting losses quickly',
      'Trading during low liquidity'
    ],
    tips: [
      'Focus on high liquidity pairs',
      'Keep position sizes small',
      'Use tight stops',
      'Monitor spread costs'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 10) return { type: null };

    const fastEMA = calculateEMA(candles, index, 5);
    const slowEMA = calculateEMA(candles, index, 10);
    const currentPrice = candles[index].close;
    const prevPrice = candles[index - 1].close;
    
    // Calculate price momentum
    const momentum = (currentPrice - prevPrice) / prevPrice;

    // Strong upward momentum with EMA confirmation
    if (momentum > 0.001 && currentPrice > fastEMA && fastEMA > slowEMA) {
      return {
        type: 'BUY',
        reason: 'Strong upward momentum with EMA confirmation'
      };
    }

    // Strong downward momentum with EMA confirmation
    if (momentum < -0.001 && currentPrice < fastEMA && fastEMA < slowEMA) {
      return {
        type: 'SELL',
        reason: 'Strong downward momentum with EMA confirmation'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 0.3,
      stopLossLevel: 0.2
    };
  }
}