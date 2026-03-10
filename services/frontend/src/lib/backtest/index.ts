import { z } from 'zod';
import moment from 'moment-timezone';
import { CURRENCIES, EXCHANGES } from '@/lib/constants';
import { STRATEGIES } from '@/lib/strategies';
import type { Strategy } from '@/lib/strategies/Strategy';
import { fetchBacktestData } from '@/lib/backtestApi';
import { BacktestConfig, BacktestResult, Candle, EntryFrequency, Trade } from '@/lib/types';

// Configuration schema
const BacktestConfigSchema = z.object({
  symbol: z.string(),
  exchange: z.string(),
  strategy: z.string(),
  timeframe: z.string(),
  entryFrequency: z.nativeEnum(EntryFrequency).optional(),
  startDate: z.string(),
  endDate: z.string(),
  initialBalance: z.number(),
  takeProfitLevel: z.number().optional(),
  stopLossLevel: z.number().optional(),
  riskPerTrade: z.number().optional(),
  maxTradeTime: z.number().optional()
}).passthrough();

interface OpenPosition {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryTime: Date;
  signals?: Trade['signals'];
}

export class TradingBacktester {
  private config: BacktestConfig;
  private balance: number;
  private strategy: Strategy;
  private trades: Trade[] = [];

  constructor(config: BacktestConfig) {
    const parsedConfig = BacktestConfigSchema.parse(config);
    const selectedStrategy = STRATEGIES.find((item) => item.name === parsedConfig.strategy);
    if (!selectedStrategy) {
      throw new Error(`Strategy "${parsedConfig.strategy}" not found`);
    }

    const defaultConfig = selectedStrategy.getDefaultConfig();
    this.config = {
      ...config,
      ...parsedConfig,
      entryFrequency: parsedConfig.entryFrequency ?? selectedStrategy.defaultFrequency,
      riskPerTrade: parsedConfig.riskPerTrade ?? 2,
      maxTradeTime: parsedConfig.maxTradeTime ?? 8,
      takeProfitLevel: parsedConfig.takeProfitLevel ?? defaultConfig.takeProfitLevel,
      stopLossLevel: parsedConfig.stopLossLevel ?? defaultConfig.stopLossLevel,
    };
    this.balance = this.config.initialBalance;
    this.strategy = selectedStrategy;
  }

  private calculatePositionSize(price: number): number {
    const riskAmount = this.balance * ((this.config.riskPerTrade ?? 2) / 100);
    return riskAmount / price;
  }

  private getMinimumRequiredCandles(): number {
    let baseRequirement = 0;

    this.strategy.indicators.forEach((indicator) => {
      switch (indicator) {
        case 'RSI': baseRequirement = Math.max(baseRequirement, 14); break;
        case 'MACD': baseRequirement = Math.max(baseRequirement, 26); break;
        case 'Bollinger Bands': baseRequirement = Math.max(baseRequirement, 20); break;
        case 'EMA': baseRequirement = Math.max(baseRequirement, 50); break;
        case 'VWAP': baseRequirement = Math.max(baseRequirement, 20); break;
        default: baseRequirement = Math.max(baseRequirement, 20);
      }
    });

    return baseRequirement;
  }

  private async getHistoricalData(): Promise<Candle[]> {
    const startTime = moment(this.config.startDate).toDate();
    const endTime = moment(this.config.endDate).toDate();
    
    // Validate date range
    if (startTime >= endTime) {
      throw new Error('Start date must be before end date');
    }

    // Calculate trading days
    const totalDays = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
    const tradingDays = Math.ceil(totalDays * 5/7); // Approximate trading days excluding weekends
    
    // Get minimum required candles
    const minRequiredCandles = this.getMinimumRequiredCandles();
    
    if (tradingDays < minRequiredCandles) {
      throw new Error(
        `Insufficient data for backtesting with ${this.strategy.name}. ` +
        `Need at least ${minRequiredCandles} trading days of data ` +
        `(approximately ${Math.ceil(minRequiredCandles * 7/5)} calendar days including weekends/holidays). ` +
        `Your selected period is ${totalDays} days and contains approximately ${tradingDays} trading days. ` +
        `Please extend your date range to include more trading days.`
      );
    }

    const [baseCurrency, targetCurrency] = this.config.symbol.split('/');
    
    // Fetch historical data for backtesting
    const historicalData = await fetchBacktestData(
      moment(startTime).format('YYYY-MM-DD'),
      moment(endTime).format('YYYY-MM-DD'),
      baseCurrency,
      targetCurrency,
      this.config.timeframe
    );

    // Validate currencies
    if (!CURRENCIES.find(c => c.code === baseCurrency) || !CURRENCIES.find(c => c.code === targetCurrency)) {
      throw new Error(`Invalid currency pair: ${this.config.symbol}`);
    }

    // Get exchange configuration
    const exchange = EXCHANGES.find(e => e.id === this.config.exchange);
    if (!exchange) {
      throw new Error(`Invalid exchange: ${this.config.exchange}`);
    }

    // Filter data based on exchange hours
    const candles = historicalData.filter(data => {
      if (this.config.timeframe === '1d') return true;
      
      const exchangeTime = moment.tz(data.date, exchange.timezone);
      const hour = exchangeTime.hour();
      return hour >= exchange.hours.open && hour < exchange.hours.close;
    }).map(data => ({
      time: data.date,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume
    }));

    return candles;
  }

  private calculateRSI(candles: Candle[], index: number): number {
    const period = 14;
    if (index < period) return 50; // Default value for insufficient data

    let gains = 0;
    let losses = 0;

    // Calculate average gains and losses
    for (let i = index - period + 1; i <= index; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(candles: Candle[], index: number): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const fastPeriod = 12;
    const slowPeriod = 26;
    const signalPeriod = 9;

    if (index < slowPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const fastEMA = this.calculateEMA(candles, index, fastPeriod);
    const slowEMA = this.calculateEMA(candles, index, slowPeriod);
    const macdLine = fastEMA - slowEMA;

    // Calculate signal line (9-day EMA of MACD)
    const macdValues = [];
    for (let i = Math.max(0, index - signalPeriod + 1); i <= index; i++) {
      const fastEMA = this.calculateEMA(candles, i, fastPeriod);
      const slowEMA = this.calculateEMA(candles, i, slowPeriod);
      macdValues.push(fastEMA - slowEMA);
    }

    const signalLine = this.calculateEMAFromValues(macdValues, signalPeriod);
    const histogram = macdLine - signalLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram,
    };
  }

  private calculateEMA(
    candles: Candle[],
    index: number,
    period: number
  ): number {
    if (index < period) return candles[index].close;

    const multiplier = 2 / (period + 1);
    const previousEMA = this.calculateEMA(candles, index - 1, period);
    return (
      (candles[index].close - previousEMA) * multiplier + previousEMA
    );
  }

  private calculateEMAFromValues(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  public async runBacktest(): Promise<BacktestResult> {
    const candles = await this.getHistoricalData();
    
    // Get minimum required candles for the selected strategy
    const minRequiredCandles = this.getMinimumRequiredCandles();
    
    if (candles.length < minRequiredCandles) {
      const startDate = new Date(this.config.startDate);
      const endDate = new Date(this.config.endDate);
      const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const recommendedDays = Math.ceil(minRequiredCandles * 1.5); // Add 50% buffer for weekends/holidays
      
      throw new Error(
        `Insufficient data for backtesting with ${this.strategy.name}. ` +
        `Need at least ${minRequiredCandles} trading days of data (approximately ${recommendedDays} calendar days including weekends/holidays). ` +
        `Your selected period is ${actualDays} days and contains only ${candles.length} trading days. ` +
        `Please extend your date range to include more trading days.`
      );
    }
    
    let position: OpenPosition | null = null;
    this.balance = this.config.initialBalance;
    this.trades = [];
    
    // Calculate minimum time between trades based on entry frequency
    const getMinTimeBetweenTrades = () => {
      switch (this.config.entryFrequency) {
        case EntryFrequency.SCALPING:
          return 1; // 1 hour
        case EntryFrequency.DAILY:
          return 24; // 24 hours
        case EntryFrequency.WEEKLY:
          return 24 * 7; // 1 week
        case EntryFrequency.MONTHLY:
          return 24 * 30; // ~1 month
        case EntryFrequency.QUARTERLY:
          return 24 * 90; // ~3 months
        default:
          return 24;
      }
    };
    
    const minTimeBetweenTrades = getMinTimeBetweenTrades();
    let lastTradeExitTime: Date | null = null;

    // Track daily trade count for intraday strategies
    let currentTradeDate = '';
    let dailyTradeCount = 0;
    const maxDailyTrades = this.config.entryFrequency === EntryFrequency.SCALPING ? 5 : 1;

    for (let i = 0; i < candles.length; i++) {
      const signal = this.strategy.calculateSignal(candles, i);
      const currentCandle = candles[i];
      const rsi = this.calculateRSI(candles, i);
      const macd = this.calculateMACD(candles, i);
      const volatility = this.calculateVolatility(candles, i);
      const exchange = EXCHANGES.find((item) => item.id === this.config.exchange);
      const exchangeTime = moment.tz(currentCandle.time, exchange?.timezone || 'UTC');
      const prevCandle = i > 0 ? candles[i - 1] : null;

      this.config.onProgress?.(((i + 1) / candles.length) * 100);

      // Reset daily trade count if it's a new day
      const candleDate = moment(currentCandle.time).format('YYYY-MM-DD');
      if (candleDate !== currentTradeDate) {
        currentTradeDate = candleDate;
        dailyTradeCount = 0;
      }

      // Check if we can take a new trade
      const canTrade = (
        // Check time between trades
        (!lastTradeExitTime || moment(currentCandle.time).diff(moment(lastTradeExitTime), 'hours') >= minTimeBetweenTrades) &&
        // Check daily trade limit
        dailyTradeCount < maxDailyTrades &&
        // Check exchange hours
        (this.config.timeframe === '1d' || (() => {
          const openHour = exchange?.hours.open ?? 0;
          const closeHour = exchange?.hours.close ?? 24;
          return exchangeTime.hour() >= openHour && exchangeTime.hour() < closeHour;
        })())
      );

      if (!position && signal.type && canTrade && prevCandle) {
        dailyTradeCount++;
        const config = this.strategy.getDefaultConfig();
        position = {
          type: signal.type,
          entryPrice: currentCandle.close,
          entryTime: currentCandle.time,
          signals: {
            rsi: { value: rsi, threshold: signal.type === 'BUY' ? 35 : 65 },
            macd: { value: macd.macd, signal: macd.signal },
            volatility,
            session: { hour: exchangeTime.hour(), market: exchange?.name || 'Unknown' },
            position: { 
              size: this.calculatePositionSize(currentCandle.close),
              risk: this.config.riskPerTrade ?? 2,
              takeProfitLevel: this.config.takeProfitLevel ?? config.takeProfitLevel,
              stopLossLevel: this.config.stopLossLevel ?? config.stopLossLevel
            }
          }
        };
      } else if (position) {
        // Calculate time in trade
        const timeInTrade = moment(currentCandle.time).diff(moment(position.entryTime), 'hours');
        
        // Calculate current profit/loss
        const positionSize = position.signals?.position?.size || 1;
        const currentPnL = ((position.type === 'BUY' ? 
          currentCandle.close - position.entryPrice : 
          position.entryPrice - currentCandle.close) * positionSize);
        
        const pnlPercentage = currentPnL / (position.entryPrice * positionSize);
        const defaultConfig = this.strategy.getDefaultConfig();
        const takeProfitLevel = position.signals?.position?.takeProfitLevel ?? this.config.takeProfitLevel ?? defaultConfig.takeProfitLevel;
        const stopLossLevel = position.signals?.position?.stopLossLevel ?? this.config.stopLossLevel ?? defaultConfig.stopLossLevel;
        const takeProfitThreshold = takeProfitLevel / 100;
        const stopLossThreshold = stopLossLevel / 100;

        const shouldExit =
          timeInTrade >= (this.config.maxTradeTime ?? 8) ||
          (position.type === 'BUY' ? (
            pnlPercentage >= takeProfitThreshold ||
            pnlPercentage <= -stopLossThreshold ||
            signal.type === 'SELL'
          ) : (
            pnlPercentage >= takeProfitThreshold ||
            pnlPercentage <= -stopLossThreshold ||
            signal.type === 'BUY'
          ));

        if (shouldExit) {
          const profit = currentPnL;

          this.trades.push({
            type: position.type,
            entryPrice: position.entryPrice,
            entryTime: position.entryTime,
            exitPrice: currentCandle.close,
            exitTime: currentCandle.time,
            profit,
            signals: {
              ...position.signals,
              position: {
                size: position.signals?.position?.size ?? positionSize,
                risk: position.signals?.position?.risk ?? (this.config.riskPerTrade ?? 2),
                takeProfitLevel,
                stopLossLevel,
              }
            },
            reason: signal.reason,
          });

          this.balance += profit;
          lastTradeExitTime = currentCandle.time; // Update last trade exit time
          position = null;
        }
      }
    }

    // Calculate metrics
    const winningTrades = this.trades.filter((t) => t.profit > 0);
    const losingTrades = this.trades.filter((t) => t.profit <= 0);
    const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0));

    const metrics = {
      winRate: this.trades.length === 0 ? 0 : (winningTrades.length / this.trades.length) * 100,
      averageWin: winningTrades.length === 0 ? 0 : grossProfit / winningTrades.length,
      averageLoss: losingTrades.length === 0 ? 0 : losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length,
      maxDrawdown: this.calculateMaxDrawdown(),
      profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
    };

    return {
      finalBalance: this.balance,
      trades: this.trades,
      metrics,
    };
  }

  private calculateMaxDrawdown(): number {
    let peak = -Infinity;
    let maxDrawdown = 0;
    let runningBalance = this.config.initialBalance;

    this.trades.forEach((trade) => {
      runningBalance += trade.profit;
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  }

  private calculateVolatility(candles: Candle[], index: number): number {
    const period = 20; // Look back period for volatility calculation
    const startIdx = Math.max(0, index - period);
    const prices = candles.slice(startIdx, index + 1).map(c => c.close);
    
    // Calculate standard deviation of price changes
    const returns = prices.slice(1).map((price, i) => 
      (price - prices[i]) / prices[i]
    );
    
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    
    return Math.sqrt(variance);
  }
}