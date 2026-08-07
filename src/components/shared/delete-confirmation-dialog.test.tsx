import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import i18next from '@/lib/i18n';

describe('DeleteConfirmationDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the title, entity name and the irreversibility notice', () => {
    render(
      <DeleteConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Delete client"
        entityName="Acme Corp"
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByText('Delete client')).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('shows the dependency warning only when provided', () => {
    const { rerender } = render(
      <DeleteConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Delete client"
        entityName="Acme Corp"
        onConfirm={() => {}}
      />,
    );

    expect(screen.queryByText(/dependent/i)).not.toBeInTheDocument();

    rerender(
      <DeleteConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Delete client"
        entityName="Acme Corp"
        dependencyWarning="May be blocked if dependent records exist."
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByText('May be blocked if dependent records exist.')).toBeInTheDocument();
  });

  it('calls onConfirm when Delete is clicked and onOpenChange(false) on Cancel', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DeleteConfirmationDialog
        open
        onOpenChange={onOpenChange}
        title="Delete client"
        entityName="Acme Corp"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables both buttons and shows the deleting label while isLoading', () => {
    render(
      <DeleteConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Delete client"
        entityName="Acme Corp"
        onConfirm={() => {}}
        isLoading
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  });

  it('renders the error message when provided', () => {
    render(
      <DeleteConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Delete client"
        entityName="Acme Corp"
        onConfirm={() => {}}
        errorMessage="Something went wrong."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });
});
