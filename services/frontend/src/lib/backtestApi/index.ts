import axios from 'axios';
import moment from 'moment-timezone';
import { DukascopyClient } from '@/lib/dukascopy';

export async function fetchBacktestData(
  startDate: string,
  endDate: string,
  baseCurrency: string,
  targetCurrency: string,
  timeframe: string = '1d'
): Promise<Array<{ date: Date; open: number; high: number; low: number; close: number; volume: number }>> {
  try {
    const dukascopyClient = DukascopyClient.getInstance();
    const symbol = `${baseCurrency}${targetCurrency}`;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }
    
    // Get ticks from Dukascopy
    const ticks = await dukascopyClient.getTicks(
      symbol,
      start,
      end,
      timeframe
    );
    
    // Convert ticks to OHLCV candles
    const candles = new Map<string, {
      time: Date;
      date: Date;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>();
    
    for (const tick of ticks) {
      const date = moment(tick.timestamp).format('YYYY-MM-DD HH:mm');
      const price = (tick.bid + tick.ask) / 2; // Use mid price
      
      if (!candles.has(date)) {
        candles.set(date, {
          time: tick.timestamp,
          date: new Date(date),
          open: price,
          high: price,
          low: price,
          close: price,
          volume: tick.bidVolume + tick.askVolume
        });
      } else {
        const candle = candles.get(date)!;
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
        candle.volume += tick.bidVolume + tick.askVolume;
      }
    }

    const data = Array.from(candles.values());
    
    if (data.length === 0) {
      throw new Error('No data available for the selected date range. Please choose a different period.');
    }
    
    return data.sort((a, b) => a.time.getTime() - b.time.getTime());

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 404) {
        throw new Error('No data available for the specified date range');
      }
      throw new Error(`Failed to fetch forex data: ${error.message}`);
    }
    throw new Error('Failed to fetch forex data');
  }
}