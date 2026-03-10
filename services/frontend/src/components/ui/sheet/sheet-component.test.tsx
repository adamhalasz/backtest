import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '.';

describe('Sheet', () => {
  it('renders trigger and open content', () => {
    render(
      <Sheet open>
        <SheetTrigger>Toggle</SheetTrigger>
        <SheetContent>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Quick links</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Quick links')).toBeInTheDocument();
  });

  it('renders header and footer helpers', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Update panel preferences</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <button type="button">Apply</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Update panel preferences')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });
});