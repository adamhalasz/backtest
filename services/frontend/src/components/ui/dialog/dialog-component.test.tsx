import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '.';

describe('Dialog', () => {
  it('renders open dialog content', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>Proceed with save</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText('Confirm action')).toBeInTheDocument();
    expect(screen.getByText('Proceed with save')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('renders header and footer helpers', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header title</DialogTitle>
            <DialogDescription>Dialog body description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button">Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText('Header title')).toBeInTheDocument();
    expect(screen.getByText('Dialog body description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});