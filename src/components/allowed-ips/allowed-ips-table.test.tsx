import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AllowedIpsTable } from '@/components/allowed-ips/allowed-ips-table';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';
import i18next from '@/lib/i18n';

function makeAllowedIp(overrides: Partial<AllowedIp>): AllowedIp {
  return {
    id: 'ip-1',
    clientId: 'client-1',
    address: '192.168.1.0/24',
    type: 'CIDR_IPV4',
    description: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
    ...overrides,
  };
}

const ALL_PERMISSIONS = { canUpdate: true, canChangeStatus: true, canDelete: true };

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

describe('AllowedIpsTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the row data with the translated type label', () => {
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({})]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument();
    expect(screen.getByText('CIDR IPv4')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows edit and status actions when the caller has full permissions', async () => {
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({})]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.getByRole('menuitem', { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Deactivate/ })).toBeInTheDocument();
  });

  it('hides write actions for a read-only caller (VIEWER/AUDITOR)', async () => {
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({})]}
        permissions={{ canUpdate: false, canChangeStatus: false, canDelete: false }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.queryByRole('menuitem', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Activate|Deactivate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /View/ })).toBeInTheDocument();
  });

  it('calls onToggleStatus with the row when the status action is clicked', async () => {
    const onToggleStatus = vi.fn();
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({ active: true })]}
        permissions={ALL_PERMISSIONS}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={onToggleStatus}
        onDelete={vi.fn()}
      />,
    );

    await openRowMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /Deactivate/ }));

    expect(onToggleStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'ip-1' }));
  });

  it('shows the delete action when the caller has canDelete', async () => {
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({})]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();
    expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeInTheDocument();
  });

  it('shows the DNS badge and the hostname address for a HOSTNAME row', () => {
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({ type: 'HOSTNAME', address: 'api.cliente.com.br' })]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    expect(screen.getByText('api.cliente.com.br')).toBeInTheDocument();
    expect(screen.getByText('DNS')).toBeInTheDocument();
  });

  it('truncates a long hostname visually (via a bounded, truncating span) without altering the real value', () => {
    const longHostname = `${'sub.'.repeat(20)}example.com`;
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({ type: 'HOSTNAME', address: longHostname })]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    const addressSpan = screen.getByText(longHostname);
    expect(addressSpan.className).toMatch(/truncate/);
    expect(addressSpan.textContent).toBe(longHostname);
  });

  it('does not wrap a plain IP/CIDR address in a truncating tooltip span', () => {
    render(
      <AllowedIpsTable
        rows={[makeAllowedIp({ type: 'CIDR_IPV4', address: '192.168.1.0/24' })]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    const addressCell = screen.getByText('192.168.1.0/24');
    expect(addressCell.tagName).toBe('TD');
  });
});
