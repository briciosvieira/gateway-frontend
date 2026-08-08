import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { RouteHeadersTable } from '@/components/route-headers/route-headers-table';
import type {
  RouteHeaderGatewayRouteOption,
  RouteHeaderListItem,
} from '@/features/route-headers/route-headers.types';
import i18next from '@/lib/i18n';

const ROW: RouteHeaderListItem = {
  id: 'header-1',
  gatewayRouteId: 'route-1',
  name: 'X-Api-Key',
  value: 'top-secret-value',
  sensitive: true,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ROUTE_CONTEXT: Record<string, RouteHeaderGatewayRouteOption> = {
  'route-1': {
    id: 'route-1',
    name: 'Send WhatsApp',
    method: 'POST',
    publicPath: '/gateway/send-whatsapp',
    client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
  },
};

describe('RouteHeadersTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('never renders the header value in the table and hides delete for non-admin permissions', async () => {
    render(
      <RouteHeadersTable
        rows={[ROW]}
        routeContexts={ROUTE_CONTEXT}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: false }}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText('top-secret-value')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('keeps the method badge from stretching full width under the route name', () => {
    render(
      <RouteHeadersTable
        rows={[ROW]}
        routeContexts={ROUTE_CONTEXT}
        permissions={{ canUpdate: true, canChangeStatus: true, canDelete: true }}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const badge = screen.getByText('POST');
    const wrapper = badge.closest('div');
    expect(wrapper?.className).toMatch(/items-start/);
  });
});
