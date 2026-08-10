import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { GatewayRoutesTable } from '@/components/gateway-routes/gateway-routes-table';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import i18next from '@/lib/i18n';

// Deterministic regardless of a local `.env.local` — the public endpoint
// should render as the relative `publicPath` alone in this test.
vi.mock('@/config/env', () => ({ env: { VITE_PUBLIC_GATEWAY_URL: undefined } }));

function makeRoute(overrides: Partial<GatewayRoute>): GatewayRoute {
  return {
    id: 'route-1',
    clientId: 'client-1',
    name: 'Send WhatsApp',
    slug: '/send-whatsapp',
    description: null,
    destinationUrl: 'https://internal.example.com/api/whatsapp',
    method: 'POST',
    timeoutMs: 30000,
    retryCount: 0,
    active: true,
    requiresApiKey: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
    publicPath: '/gateway/send-whatsapp',
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

describe('GatewayRoutesTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the row data, including the method badge and the public endpoint (never the destination URL)', () => {
    render(
      <GatewayRoutesTable rows={[makeRoute({})]} permissions={ALL_PERMISSIONS} {...NOOP_ACTIONS} />,
    );

    expect(screen.getByText('Send WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/send-whatsapp')).toBeInTheDocument();
    expect(screen.getByText('/gateway/send-whatsapp')).toBeInTheDocument();
    expect(screen.queryByText('https://internal.example.com/api/whatsapp')).not.toBeInTheDocument();
  });

  it('shows edit and status actions when the caller has full permissions', async () => {
    render(
      <GatewayRoutesTable rows={[makeRoute({})]} permissions={ALL_PERMISSIONS} {...NOOP_ACTIONS} />,
    );

    await openRowMenu();

    expect(screen.getByRole('menuitem', { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Deactivate/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeInTheDocument();
  });

  it('hides write actions for a read-only caller (VIEWER/AUDITOR)', async () => {
    render(
      <GatewayRoutesTable
        rows={[makeRoute({})]}
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

  it('hides the delete action for OPERATOR (no delete permission)', async () => {
    render(
      <GatewayRoutesTable
        rows={[makeRoute({})]}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: false }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.getByRole('menuitem', { name: /Edit/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
  });

  it('calls onDelete with the row when the delete action is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <GatewayRoutesTable
        rows={[makeRoute({})]}
        permissions={ALL_PERMISSIONS}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await openRowMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'route-1' }));
  });

  it('shows no API Key alert badge for a route that requires it', () => {
    render(
      <GatewayRoutesTable
        rows={[makeRoute({ requiresApiKey: true })]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    expect(screen.queryByText('No API Key')).not.toBeInTheDocument();
  });

  it('shows the "No API Key" warning badge for a route with requiresApiKey=false, independently of Active/Inactive status', () => {
    render(
      <GatewayRoutesTable
        rows={[makeRoute({ requiresApiKey: false, active: false })]}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    expect(screen.getByText('No API Key')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
