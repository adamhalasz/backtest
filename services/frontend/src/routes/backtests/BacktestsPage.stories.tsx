import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAppStore } from '@/store';
import { BacktestsPage } from './BacktestsPage';

const meta = {
  title: 'Routes/Backtests/Page',
  component: BacktestsPage,
  decorators: [
    (Story) => {
      useAppStore.setState({
        loading: {},
        errors: {},
        backtests: [
          {
            id: 'bt-1',
            created_at: '2026-03-10T00:00:00.000Z',
            status: 'completed',
            symbol: 'EUR/USD',
            exchange: 'london',
            strategy: 'Momentum Strategy',
            start_date: '2025-01-01',
            end_date: '2025-02-01',
            initial_balance: 10000,
            final_balance: 11250,
            win_rate: 64,
            profit_factor: 1.7,
            max_drawdown: 4.5,
            parameters: { assetClass: 'forex', provider: 'yahoo', takeProfitLevel: 2, stopLossLevel: 1 },
          },
        ],
        fetchBacktests: async () => {},
      });

      return (
        <div className="min-h-screen bg-slate-50 p-8">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof BacktestsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};