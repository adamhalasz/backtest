import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, badgeVariants } from '.';

describe('Badge', () => {
  it('renders content', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('builds variant classes', () => {
    expect(badgeVariants({ variant: 'secondary' })).toContain('bg-secondary');
  });
});