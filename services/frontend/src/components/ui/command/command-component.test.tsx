import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '.';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';

describe('Command', () => {
  it('renders input and list content', () => {
    render(
      <Command>
        <CommandInput placeholder="Search items" />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Items">
            <CommandItem>Alpha</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );

    expect(screen.getByPlaceholderText('Search items')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders dialog, separators, and shortcuts', () => {
    render(
      <CommandDialog open>
        <DialogTitle>Command palette</DialogTitle>
        <DialogDescription>Quick actions</DialogDescription>
        <CommandInput placeholder="Jump" />
        <CommandList>
          <CommandGroup heading="Actions">
            <CommandItem>
              Create bot
              <CommandShortcut>CMD+B</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </CommandDialog>,
    );

    expect(screen.getByPlaceholderText('Jump')).toBeInTheDocument();
    expect(screen.getByText('CMD+B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
});