import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from '.';

describe('Label', () => {
  it('renders text and forwards htmlFor', () => {
    render(
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </div>,
    );

    expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
  });
});