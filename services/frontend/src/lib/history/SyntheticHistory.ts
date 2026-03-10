import moment from 'moment-timezone';
import { Candle, HistorySource } from './types';

export class SyntheticHistory implements HistorySource {
  async fetchData(
    startDate: string,
    endDate: string,
    baseCurrency: string,
    targetCurrency: string
  ): Promise<Candle[]> {
    const start = moment(startDate);
    const end = moment(endDate);
    const days = end.diff(start, 'days');
    
    // Generate synthetic price data with realistic patterns
    const data: Candle[] = [];
    let currentPrice = this.getInitialPrice(baseCurrency, targetCurrency);
    let trend = 0.0001; // Small upward trend
    let volatility = 0.002; // 0.2% daily volatility

    for (let i = 0; i <= days; i++) {
      const date = moment(startDate).add(i, 'days');
      
      // Skip weekends
      if (date.day() === 0 || date.day() === 6) continue;

      // Add some randomness to trend and volatility
      trend += (Math.random() - 0.5) * 0.0001;
      volatility *= 0.99 + Math.random() * 0.02;

      // Calculate daily price movement
      const dailyChange = trend + (Math.random() - 0.5) * volatility;
      currentPrice *= (1 + dailyChange);

      // Generate realistic OHLC data
      const open = currentPrice;
      const close = currentPrice * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * volatility);
      const low = Math.min(open, close) * (1 - Math.random() * volatility);
      
      // Generate realistic volume
      const volume = Math.floor(1000000 + Math.random() * 9000000);

      data.push({
        date: date.toDate(),
        open,
        high,
        low,
        close,
        volume
      });
    }

    // Sort by date
    return data.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getInitialPrice(baseCurrency: string, targetCurrency: string): number {
    // Realistic starting prices for common currency pairs
    const pairs: { [key: string]: number } = {
      'EUR/USD': 1.15,
      'GBP/USD': 1.35,
      'USD/JPY': 110.0,
      'USD/CHF': 0.92,
      'AUD/USD': 0.75,
      'USD/CAD': 1.25,
      'NZD/USD': 0.70,
    };

    const pair = `${baseCurrency}/${targetCurrency}`;
    return pairs[pair] || 1.0; // Default to 1.0 if pair not found
  }
}