import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '.';

describe('HoverCard', () => {
  it('renders trigger and open content', () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>Details</HoverCardTrigger>
        <HoverCardContent>Hover details</HoverCardContent>
      </HoverCard>,
    );

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Hover details')).toBeInTheDocument();
  });
});