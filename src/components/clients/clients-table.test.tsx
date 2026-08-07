import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ClientsTable } from '@/components/clients/clients-table';
import type { Client } from '@/features/clients/clients.types';
import i18next from '@/lib/i18n';

function makeClient(overrides: Partial<Client>): Client {
  return {
    id: 'client-1',
    name: 'Acme Corp',
    code: 'ACME',
    description: null,
    contactName: 'Jane Doe',
    contactEmail: 'jane@acme.com',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NOOP_ACTIONS = {
  onView: vi.fn(),
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onDelete: vi.fn(),
};

async function openRowMenu() {
  const trigger = screen.getByRole('button', { name: 'Actions' });
  fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
  fireEvent.pointerUp(trigger, { button: 0, pointerType: 'mouse' });
  fireEvent.click(trigger);
  return screen.findByRole('menu');
}

describe('ClientsTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the row data', () => {
    render(
      <ClientsTable
        rows={[makeClient({})]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: true }}
        {...NOOP_ACTIONS}
      />,
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('ACME')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@acme.com')).toBeInTheDocument();
  });

  it('shows a fallback for missing optional contact fields', () => {
    render(
      <ClientsTable
        rows={[makeClient({ contactName: null, contactEmail: null })]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: true }}
        {...NOOP_ACTIONS}
      />,
    );

    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('shows edit and status actions when the caller has full permissions', async () => {
    render(
      <ClientsTable
        rows={[makeClient({})]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: true }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.getByRole('menuitem', { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Deactivate/ })).toBeInTheDocument();
  });

  it('hides write actions for a read-only caller (e.g. VIEWER/AUDITOR)', async () => {
    render(
      <ClientsTable
        rows={[makeClient({})]}
        permissions={{ canUpdate: false, canChangeStatus: false, canDelete: false }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.queryByRole('menuitem', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Activate|Deactivate/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /View/ })).toBeInTheDocument();
  });

  it('calls onToggleStatus with the row when the status action is clicked', async () => {
    const onToggleStatus = vi.fn();
    render(
      <ClientsTable
        rows={[makeClient({ active: true })]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: true }}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={onToggleStatus}
        onDelete={vi.fn()}
      />,
    );

    await openRowMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /Deactivate/ }));

    expect(onToggleStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'client-1' }));
  });

  it('shows the delete action only when the caller has canDelete', async () => {
    render(
      <ClientsTable
        rows={[makeClient({})]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: true }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();
    expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeInTheDocument();
  });

  it('hides the delete action when the caller lacks canDelete (non-ADMIN)', async () => {
    render(
      <ClientsTable
        rows={[makeClient({})]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: false }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
  });

  it('calls onDelete with the row when the delete action is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <ClientsTable
        rows={[makeClient({})]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: true }}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await openRowMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'client-1' }));
  });
});
