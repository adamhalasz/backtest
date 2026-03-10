import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonVariants } from '.';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when requested', () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('renders as a child element when requested', () => {
    render(
      <Button asChild>
        <a href="/backtests">Open</a>
      </Button>,
    );

    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/backtests');
  });

  it('builds variant classes', () => {
    expect(buttonVariants({ variant: 'secondary', size: 'sm' })).toContain('bg-secondary');
  });
});