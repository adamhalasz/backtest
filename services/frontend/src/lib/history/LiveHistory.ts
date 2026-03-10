import axios from 'axios';
import { Candle, HistorySource } from './types';
import { DukascopyClient } from '../dukascopy';

export class LiveHistory implements HistorySource {
  private dukascopyClient: DukascopyClient;

  constructor() {
    this.dukascopyClient = DukascopyClient.getInstance();
  }

  async fetchData(
    startDate: string,
    endDate: string,
    baseCurrency: string,
    targetCurrency: string
  ): Promise<Candle[]> {
    try {
      const symbol = `${baseCurrency}${targetCurrency}`;
      const ticks = await this.dukascopyClient.getTicks(
        symbol,
        new Date(startDate),
        new Date(endDate)
      );

      // Convert ticks to candles
      const candles: Candle[] = [];
      let currentCandle: Partial<Candle> | null = null;
      let currentMinute = -1;

      for (const tick of ticks) {
        const tickMinute = Math.floor(tick.timestamp.getTime() / (60 * 1000));
        
        if (tickMinute !== currentMinute) {
          if (currentCandle) {
            candles.push({
              date: new Date(currentMinute * 60 * 1000),
              open: currentCandle.open!,
              high: currentCandle.high!,
              low: currentCandle.low!,
              close: currentCandle.close!,
              volume: currentCandle.volume!
            });
          }
          
          currentCandle = {
            open: tick.bid,
            high: tick.bid,
            low: tick.bid,
            close: tick.bid,
            volume: tick.bidVolume + tick.askVolume
          };
          currentMinute = tickMinute;
        } else {
          currentCandle!.high = Math.max(currentCandle!.high!, tick.bid);
          currentCandle!.low = Math.min(currentCandle!.low!, tick.bid);
          currentCandle!.close = tick.bid;
          currentCandle!.volume! += tick.bidVolume + tick.askVolume;
        }
      }

      // Add the last candle
      if (currentCandle) {
        candles.push({
          date: new Date(currentMinute * 60 * 1000),
          open: currentCandle.open!,
          high: currentCandle.high!,
          low: currentCandle.low!,
          close: currentCandle.close!,
          volume: currentCandle.volume!
        });
      }

      if (candles.length === 0) {
        throw new Error('No data available for the specified date range');
      }

      return candles;
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
}