import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ClientResourceListTable } from '@/components/shared/client-resource-list-table';
import type { ClientRef } from '@/features/clients/clients.types';
import i18next from '@/lib/i18n';

interface SummaryRow {
  client: ClientRef;
  total: number;
  active: number;
  inactive: number;
}

const ROWS: SummaryRow[] = [
  {
    client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
    total: 5,
    active: 3,
    inactive: 2,
  },
  {
    client: {
      id: 'client-2',
      name: 'Parceiro Logístico',
      code: 'parceiro-logistico',
      active: true,
    },
    total: 2,
    active: 0,
    inactive: 2,
  },
];

describe('ClientResourceListTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders one row per client with name and identifier, deriving STATUS from the resource aggregate (isActive), never from client.active', () => {
    render(
      <ClientResourceListTable
        rows={ROWS}
        getClient={(row) => row.client}
        isActive={(row) => row.active > 0}
        actionLabel="View API Keys"
        caption="API Keys"
        onOpenClient={vi.fn()}
      />,
    );

    expect(screen.getByText('duda N8N')).toBeInTheDocument();
    expect(screen.getByText('duda-n8n')).toBeInTheDocument();
    expect(screen.getByText('Parceiro Logístico')).toBeInTheDocument();

    // Row 1 has active=3 > 0 -> Active. Row 2 has active=0 -> Inactive, even
    // though both clients' own `client.active` is `true` — proves the badge
    // never reads `client.active`.
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Active')).toHaveLength(1);
    expect(within(table).getAllByText('Inactive')).toHaveLength(1);
  });

  it('renders optional per-row counts alongside the status badge', () => {
    render(
      <ClientResourceListTable
        rows={ROWS}
        getClient={(row) => row.client}
        isActive={(row) => row.active > 0}
        renderCounts={(row) => `${row.total} total`}
        actionLabel="View API Keys"
        caption="API Keys"
        onOpenClient={vi.fn()}
      />,
    );

    expect(screen.getByText('5 total')).toBeInTheDocument();
    expect(screen.getByText('2 total')).toBeInTheDocument();
  });

  it('opens the client both via the row click and via the explicit action button', () => {
    const onOpenClient = vi.fn();
    render(
      <ClientResourceListTable
        rows={ROWS}
        getClient={(row) => row.client}
        isActive={(row) => row.active > 0}
        actionLabel="View API Keys"
        caption="API Keys"
        onOpenClient={onOpenClient}
      />,
    );

    fireEvent.click(screen.getByText('duda N8N'));
    expect(onOpenClient).toHaveBeenCalledWith(ROWS[0].client);

    fireEvent.click(screen.getAllByRole('button', { name: 'View API Keys' })[1]);
    expect(onOpenClient).toHaveBeenCalledWith(ROWS[1].client);
  });
});
