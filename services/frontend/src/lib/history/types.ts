export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistorySource {
  fetchData(
    startDate: string,
    endDate: string,
    baseCurrency: string,
    targetCurrency: string
  ): Promise<Candle[]>;
}