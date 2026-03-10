import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotFoundPage } from './NotFoundPage';

const meta = {
  title: 'Routes/Not Found/Page',
  component: NotFoundPage,
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-slate-50 p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotFoundPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};