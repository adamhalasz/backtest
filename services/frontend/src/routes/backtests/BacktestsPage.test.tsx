import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAppStore } from '@/store';
import { BacktestsPage } from './BacktestsPage';

vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('BacktestsPage', () => {
  beforeEach(() => {
    useAppStore.setState({
      loading: {},
      errors: {},
      backtests: [
        {
          id: 'bt-1',
          created_at: '2026-03-10T00:00:00.000Z',
          symbol: 'EUR/USD',
          exchange: 'oanda',
          strategy: 'Momentum Strategy',
          start_date: '2025-01-01',
          end_date: '2025-02-01',
          initial_balance: 10000,
          final_balance: 11250,
          win_rate: 64,
          profit_factor: 1.7,
          max_drawdown: 4.5,
          parameters: { takeProfitLevel: 2, stopLossLevel: 1 },
        },
      ],
      fetchBacktests: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders grouped backtests', () => {
    render(<BacktestsPage />);

    expect(screen.getByText('Backtests')).toBeInTheDocument();
    expect(screen.getByText('Momentum Strategy')).toBeInTheDocument();
    expect(screen.getByText(/1 backtest/i)).toBeInTheDocument();
  });
});