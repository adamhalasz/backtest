import { SyntheticHistory } from './SyntheticHistory';
import { LiveHistory } from './LiveHistory';
import { HistorySource } from './types';

export class HistoryProvider {
  private static instance: HistoryProvider;
  private currentSource: HistorySource;

  private constructor() {
    this.currentSource = new SyntheticHistory(); // Default to synthetic data
  }

  public static getInstance(): HistoryProvider {
    if (!HistoryProvider.instance) {
      HistoryProvider.instance = new HistoryProvider();
    }
    return HistoryProvider.instance;
  }

  public setSource(source: 'synthetic' | 'live'): void {
    this.currentSource = source === 'synthetic' ? new SyntheticHistory() : new LiveHistory();
  }

  public getSource(): HistorySource {
    return this.currentSource;
  }
}