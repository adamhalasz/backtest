import type { Meta, StoryObj } from '@storybook/react-vite';
import { MainNav } from './MainNav';

const meta = {
  title: 'Components/Layout/MainNav',
  component: MainNav,
  decorators: [
    (Story) => (
      <div className="w-72 border-r bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MainNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};