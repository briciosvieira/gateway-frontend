import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import i18next from '@/lib/i18n';

describe('ConfirmationDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the title and description when open', () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Deactivate user"
        description="Are you sure?"
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByText('Deactivate user')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render dialog content when closed', () => {
    render(
      <ConfirmationDialog
        open={false}
        onOpenChange={() => {}}
        title="Deactivate user"
        description="Are you sure?"
        onConfirm={() => {}}
      />,
    );

    expect(screen.queryByText('Deactivate user')).not.toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Deactivate user"
        description="Are you sure?"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        title="Deactivate user"
        description="Are you sure?"
        onConfirm={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables both buttons and shows the loading label while isLoading', () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Deactivate user"
        description="Are you sure?"
        onConfirm={() => {}}
        isLoading
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled();
  });

  it('renders the error message when provided', () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Deactivate user"
        description="Are you sure?"
        onConfirm={() => {}}
        errorMessage="Something went wrong."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });
});
