import { EntryFrequency, Indicator } from '../types';
import { Strategy, StrategySignal } from './Strategy';
import { Candle } from '../types';

export class GridTradingStrategy implements Strategy {
  name = 'Grid Trading Strategy';
  description = 'Places buy and sell orders at regular price intervals to profit from range-bound markets';
  defaultFrequency = EntryFrequency.DAILY;
  indicators = [Indicator.PRICE_ACTION];
  guide = {
    overview: 'The Grid Trading Strategy creates a grid of buy and sell orders at predetermined price levels. It excels in range-bound markets by capitalizing on price oscillations.',
    entryRules: {
      buy: [
        'Price reaches lower grid level',
        'Volume confirms support',
        'No strong downward momentum'
      ],
      sell: [
        'Price reaches upper grid level',
        'Volume confirms resistance',
        'No strong upward momentum'
      ]
    },
    exitRules: {
      takeProfit: [
        'Price reaches next grid level',
        'Profit target achieved',
        'Market shows reversal signs'
      ],
      stopLoss: [
        'Price breaks beyond grid range',
        'Strong trend develops',
        'Volatility exceeds grid spacing'
      ]
    },
    bestTimeframes: [
      'Primary: 4-hour chart for grid placement',
      'Secondary: 1-hour chart for execution',
      'Higher: Daily chart for range identification'
    ],
    marketConditions: {
      favorable: [
        'Range-bound markets',
        'Stable volatility',
        'Clear support/resistance levels'
      ],
      unfavorable: [
        'Strong trending markets',
        'Breakout conditions',
        'High volatility periods'
      ]
    },
    riskManagement: {
      positionSizing: 'Equal position size for each grid level',
      maxRiskPerTrade: '0.5% per grid level',
      recommendedLeverage: 'Maximum 2:1 leverage'
    },
    commonMistakes: [
      'Using too tight grid spacing',
      'Trading during trends',
      'Incorrect range identification',
      'Over-leveraging grid positions'
    ],
    tips: [
      'Adjust grid spacing to volatility',
      'Monitor overall market direction',
      'Use proper position sizing',
      'Have patience in ranging markets'
    ]
  };

  calculateSignal(candles: Candle[], index: number): StrategySignal {
    if (index < 20) return { type: null };

    const period = 20;
    const gridSize = 0.002; // 0.2% grid spacing
    
    const recentPrices = candles.slice(index - period + 1, index + 1);
    const avgPrice = recentPrices.reduce((sum, c) => sum + c.close, 0) / period;
    const currentPrice = candles[index].close;
    
    // Calculate grid levels
    const upperGrid = avgPrice * (1 + gridSize);
    const lowerGrid = avgPrice * (1 - gridSize);

    // Buy at lower grid level
    if (currentPrice <= lowerGrid) {
      return {
        type: 'BUY',
        reason: 'Price reached lower grid level'
      };
    }

    // Sell at upper grid level
    if (currentPrice >= upperGrid) {
      return {
        type: 'SELL',
        reason: 'Price reached upper grid level'
      };
    }

    return { type: null };
  }

  getDefaultConfig() {
    return {
      takeProfitLevel: 0.5,
      stopLossLevel: 0.3
    };
  }
}