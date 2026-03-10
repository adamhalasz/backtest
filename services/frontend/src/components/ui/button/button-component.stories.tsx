import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button-component';

const meta = {
  title: 'Components/UI/Button',
  component: Button,
  args: {
    children: 'Save',
    variant: 'default',
    size: 'default',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};