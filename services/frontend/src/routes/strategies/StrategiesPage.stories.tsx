import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAppStore } from '@/store';
import { StrategiesPage } from './StrategiesPage';

const meta = {
  title: 'Routes/Strategies/Page',
  component: StrategiesPage,
  decorators: [
    (Story) => {
      useAppStore.setState({
        loading: {},
        errors: {},
        strategyStats: {
          'Momentum Strategy': {
            totalBacktests: 6,
            avgWinRate: 61,
            avgProfitFactor: 1.6,
            avgDrawdown: 4.2,
            bestTrade: 9.4,
            worstTrade: -2.1,
          },
        },
        fetchStrategyStats: async () => {},
      });

      return (
        <div className="min-h-screen bg-slate-50 p-8">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof StrategiesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};