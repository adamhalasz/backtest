import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainNav } from '.';

vi.mock('wouter', () => ({
  Link: ({ children, href, className }: { children: ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  useLocation: () => ['/bots', vi.fn()],
}));

describe('MainNav', () => {
  it('renders the primary navigation items', () => {
    render(<MainNav />);

    expect(screen.getByRole('link', { name: /bots/i })).toHaveAttribute('href', '/bots');
    expect(screen.getByRole('link', { name: /strategies/i })).toHaveAttribute('href', '/strategies');
    expect(screen.getByRole('link', { name: /backtest/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /explorer/i })).toHaveAttribute('href', '/explorer');
  });
});