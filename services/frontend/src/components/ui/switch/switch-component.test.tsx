import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Switch } from '.';

describe('Switch', () => {
  it('renders an accessible switch', () => {
    render(<Switch checked aria-label="Auto refresh" />);
    expect(screen.getByRole('switch', { name: 'Auto refresh' })).toHaveAttribute('data-state', 'checked');
  });
});