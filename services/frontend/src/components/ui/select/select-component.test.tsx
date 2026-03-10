import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '.';

describe('Select', () => {
  it('renders trigger and items when open', () => {
    render(
      <Select open value="eur">
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="eur">EUR</SelectItem>
          <SelectItem value="usd">USD</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(screen.getAllByText('EUR')).toHaveLength(2);
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders label, separators, and scroll helpers', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Choose option" />
        </SelectTrigger>
        <SelectContent>
          <SelectScrollUpButton />
          <SelectGroup>
            <SelectLabel>Currencies</SelectLabel>
            <SelectItem value="gbp">GBP</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectScrollDownButton />
        </SelectContent>
      </Select>,
    );

    expect(screen.getByText('Currencies')).toBeInTheDocument();
    expect(screen.getByText('GBP')).toBeInTheDocument();
  });
});