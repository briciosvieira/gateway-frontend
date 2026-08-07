import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ApiKeysTable } from '@/components/api-keys/api-keys-table';
import type { ApiKey } from '@/features/api-keys/api-keys.types';
import i18next from '@/lib/i18n';

function makeApiKey(overrides: Partial<ApiKey>): ApiKey {
  return {
    id: 'key-1',
    clientId: 'client-1',
    name: 'Integration Key',
    prefix: 'ghlf_a83f2d1c',
    active: true,
    expiresAt: null,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
    ...overrides,
  };
}

const ALL_PERMISSIONS = {
  canUpdate: true,
  canChangeStatus: true,
  canRevoke: true,
  canRegenerate: true,
  canDelete: true,
};

const NOOP_ACTIONS = {
  onView: vi.fn(),
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onRevoke: vi.fn(),
  onRegenerate: vi.fn(),
  onDelete: vi.fn(),
};

async function openRowMenu() {
  const trigger = screen.getByRole('button', { name: 'Actions' });
  fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
  fireEvent.pointerUp(trigger, { button: 0, pointerType: 'mouse' });
  fireEvent.click(trigger);
  return screen.findByRole('menu');
}

describe('ApiKeysTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the row data without ever showing a secret/hash', () => {
    render(
      <ApiKeysTable rows={[makeApiKey({})]} permissions={ALL_PERMISSIONS} {...NOOP_ACTIONS} />,
    );

    expect(screen.getByText('Integration Key')).toBeInTheDocument();
    expect(screen.getByText('ghlf_a83f2d1c')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText(/secret/i)).not.toBeInTheDocument();
  });

  it('shows every action when the caller has full permissions on a non-revoked key', async () => {
    render(
      <ApiKeysTable rows={[makeApiKey({})]} permissions={ALL_PERMISSIONS} {...NOOP_ACTIONS} />,
    );

    await openRowMenu();

    expect(screen.getByRole('menuitem', { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Deactivate/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Regenerate/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Revoke/ })).toBeInTheDocument();
  });

  it('hides status toggle and revoke for an already-revoked key, but keeps regenerate', async () => {
    render(
      <ApiKeysTable
        rows={[makeApiKey({ active: false, revokedAt: '2026-01-02T00:00:00.000Z' })]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.queryByRole('menuitem', { name: /Activate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Revoke/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Regenerate/ })).toBeInTheDocument();
  });

  it('hides all write actions for a read-only caller (VIEWER/AUDITOR)', async () => {
    render(
      <ApiKeysTable
        rows={[makeApiKey({})]}
        permissions={{
          canUpdate: false,
          canChangeStatus: false,
          canRevoke: false,
          canRegenerate: false,
          canDelete: false,
        }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.queryByRole('menuitem', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Deactivate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Regenerate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Revoke/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /View/ })).toBeInTheDocument();
  });

  it('shows the delete action when the caller has canDelete, and never reveals the key value', async () => {
    render(
      <ApiKeysTable rows={[makeApiKey({})]} permissions={ALL_PERMISSIONS} {...NOOP_ACTIONS} />,
    );

    await openRowMenu();

    expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeInTheDocument();
    expect(screen.queryByText(/secret/i)).not.toBeInTheDocument();
  });

  it('marks an expired key visually', () => {
    const { container } = render(
      <ApiKeysTable
        rows={[makeApiKey({ expiresAt: '2020-01-01T00:00:00.000Z' })]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    expect(container.querySelector('span.text-destructive')).toBeInTheDocument();
  });
});
