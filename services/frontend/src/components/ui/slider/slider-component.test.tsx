import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slider } from '.';

describe('Slider', () => {
  it('renders slider thumbs', () => {
    render(<Slider defaultValue={[25, 75]} max={100} step={1} />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });
});