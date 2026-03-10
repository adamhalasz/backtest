import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAppStore } from '@/store';
import { EntryFrequency } from '@/lib/types';
import { BotsPage } from './BotsPage';

const meta = {
  title: 'Routes/Bots/Page',
  component: BotsPage,
  decorators: [
    (Story) => {
      useAppStore.setState({
        loading: {},
        errors: {},
        bots: [
          {
            id: 'bot-1',
            name: 'London Open',
            strategy: 'Momentum Strategy',
            symbol: 'EUR/USD',
            exchange: 'oanda',
            status: 'active',
            parameters: {
              entryFrequency: EntryFrequency.DAILY,
              timeframe: '1d',
              takeProfitLevel: 2,
              stopLossLevel: 1,
              rsiOverbought: 65,
              rsiOversold: 35,
            },
            created_at: '2026-03-10T00:00:00.000Z',
            updated_at: '2026-03-10T00:00:00.000Z',
            last_trade_at: '2026-03-10T00:00:00.000Z',
            total_trades: 42,
            win_rate: 61,
            total_profit: 2840,
          },
        ],
        fetchBots: async () => {},
        updateBotStatus: async () => {},
        deleteBot: async () => {},
      });

      return (
        <div className="min-h-screen bg-slate-50 p-8">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof BotsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};