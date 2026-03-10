import { MomentumStrategy } from './MomentumStrategy';
import { MeanReversionStrategy } from './MeanReversionStrategy';
import { TrendFollowingStrategy } from './TrendFollowingStrategy';
import { BollingerBandsStrategy } from './BollingerBandsStrategy';
import { BreakoutStrategy } from './BreakoutStrategy';
import { DualMovingAverageStrategy } from './DualMovingAverageStrategy';
import { GridTradingStrategy } from './GridTradingStrategy';
import { IchimokuStrategy } from './IchimokuStrategy';
import { PriceActionStrategy } from './PriceActionStrategy';
import { RSIDivergenceStrategy } from './RSIDivergenceStrategy';
import { ScalpingStrategy } from './ScalpingStrategy';
import { SwingTradingStrategy } from './SwingTradingStrategy';
import { VolumeWeightedStrategy } from './VolumeWeightedStrategy';
import { 
  TrendingUp, 
  ArrowDownUp, 
  LineChart, 
  Waves, 
  ArrowUpDown, 
  MoveDiagonal, 
  Grid, 
  CloudLightning, 
  CandlestickChart, 
  Activity, 
  Timer, 
  TimerOff, 
  BarChart4 
} from 'lucide-react';

export const STRATEGY_TIMEFRAMES = {
  'Momentum Strategy': '5m',
  'Mean Reversion Strategy': '15m',
  'Trend Following Strategy': '1h',
  'Bollinger Bands Strategy': '15m',
  'Breakout Strategy': '1h',
  'Dual Moving Average Strategy': '1h',
  'Grid Trading Strategy': '15m',
  'Ichimoku Cloud Strategy': '4h',
  'Price Action Strategy': '15m',
  'RSI Divergence Strategy': '15m',
  'Scalping Strategy': '1m',
  'Swing Trading Strategy': '4h',
  'Volume Weighted Strategy': '15m'
};

export const STRATEGY_ICONS = {
  'Momentum Strategy': TrendingUp,
  'Mean Reversion Strategy': ArrowDownUp,
  'Trend Following Strategy': LineChart,
  'Bollinger Bands Strategy': Waves,
  'Breakout Strategy': ArrowUpDown,
  'Dual Moving Average Strategy': MoveDiagonal,
  'Grid Trading Strategy': Grid,
  'Ichimoku Cloud Strategy': CloudLightning,
  'Price Action Strategy': CandlestickChart,
  'RSI Divergence Strategy': Activity,
  'Scalping Strategy': Timer,
  'Swing Trading Strategy': TimerOff,
  'Volume Weighted Strategy': BarChart4
};

export const STRATEGIES = [
  new MomentumStrategy(),
  new MeanReversionStrategy(),
  new TrendFollowingStrategy(),
  new BollingerBandsStrategy(),
  new BreakoutStrategy(),
  new DualMovingAverageStrategy(),
  new GridTradingStrategy(),
  new IchimokuStrategy(),
  new PriceActionStrategy(),
  new RSIDivergenceStrategy(),
  new ScalpingStrategy(),
  new SwingTradingStrategy(),
  new VolumeWeightedStrategy(),
];