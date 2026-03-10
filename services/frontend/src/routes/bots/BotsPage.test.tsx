import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAppStore } from '@/store';
import { EntryFrequency } from '@/lib/types';
import { BotsPage } from './BotsPage';

vi.mock('wouter', () => ({
  useLocation: () => ['/bots', vi.fn()],
}));

describe('BotsPage', () => {
  beforeEach(() => {
    useAppStore.setState({
      loading: {},
      errors: {},
      bots: [
        {
          id: 'bot-1',
          name: 'London Open',
          strategy: 'Momentum Strategy',
          symbol: 'EUR/USD',
          exchange: 'london',
          status: 'paused',
          parameters: {
            entryFrequency: EntryFrequency.DAILY,
            timeframe: '1d',
            assetClass: 'forex',
            provider: 'yahoo',
            takeProfitLevel: 2,
            stopLossLevel: 1,
            rsiOverbought: 65,
            rsiOversold: 35,
          },
          created_at: '2026-03-10T00:00:00.000Z',
          updated_at: '2026-03-10T00:00:00.000Z',
          last_trade_at: null,
          total_trades: 18,
          win_rate: 58,
          total_profit: 1320,
        },
      ],
      fetchBots: vi.fn().mockResolvedValue(undefined),
      updateBotStatus: vi.fn().mockResolvedValue(undefined),
      deleteBot: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders saved bots', () => {
    render(<BotsPage />);

    expect(screen.getByText('Trading Bots')).toBeInTheDocument();
    expect(screen.getByText('London Open')).toBeInTheDocument();
    expect(screen.getByText('Forex')).toBeInTheDocument();
    expect(screen.getByText('Yahoo Finance')).toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });
});