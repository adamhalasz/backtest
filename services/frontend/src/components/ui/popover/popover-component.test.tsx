import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Popover, PopoverContent, PopoverTrigger } from '.';

describe('Popover', () => {
  it('renders trigger and open content', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>,
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });
});