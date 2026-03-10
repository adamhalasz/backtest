import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from '.';

describe('Separator', () => {
  it('renders with vertical orientation classes', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toHaveClass('h-full');
  });

  it('renders horizontal separators by default', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toHaveClass('w-full');
  });
});