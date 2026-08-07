import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { RequestLogsTable } from '@/components/request-logs/request-logs-table';
import type { RequestLogListItem } from '@/features/request-logs/request-logs.types';
import i18next from '@/lib/i18n';

const rows: RequestLogListItem[] = [
  {
    id: 'log-1',
    requestId: 'req-1',
    attemptedAt: '2026-08-07T12:00:00.000Z',
    requestOrigin: 'PUBLIC',
    sourceHost: 'hub.example.com',
    clientId: 'client-1',
    apiKeyId: 'api-key-1',
    gatewayRouteId: 'route-1',
    sourceIp: '177.1.1.1',
    method: 'POST',
    publicPath: '/gateway/webhook',
    publicEndpoint: 'https://hub.example.com/gateway/webhook',
    destinationHost: 'n8n.internal',
    destinationIp: '10.0.0.1',
    statusCode: 200,
    durationMs: 184,
    attempts: 1,
    result: 'SUCCESS',
    errorCode: null,
    errorMessage: null,
    requestSizeBytes: 120,
    responseSizeBytes: 340,
    createdAt: '2026-08-07T12:00:01.000Z',
    client: { id: 'client-1', name: 'Syngoo', code: 'syngoo' },
    apiKey: { id: 'api-key-1', name: 'Primary key' },
    gatewayRoute: { id: 'route-1', name: 'Webhook', slug: '/webhook', method: 'POST' },
  },
  {
    id: 'log-2',
    requestId: 'req-2',
    attemptedAt: '2026-08-07T12:10:00.000Z',
    requestOrigin: 'INTERNAL',
    sourceHost: 'internal-host',
    clientId: null,
    apiKeyId: null,
    gatewayRouteId: null,
    sourceIp: '10.0.0.10',
    method: 'GET',
    publicPath: '/gateway/internal',
    publicEndpoint: null,
    destinationHost: null,
    destinationIp: '10.0.0.20',
    statusCode: 502,
    durationMs: 1240,
    attempts: 3,
    result: 'ERROR',
    errorCode: 'UPSTREAM_UNAVAILABLE',
    errorMessage: 'The upstream service is unavailable.',
    requestSizeBytes: null,
    responseSizeBytes: null,
    createdAt: '2026-08-07T12:10:01.000Z',
    client: null,
    apiKey: null,
    gatewayRoute: null,
  },
];

describe('RequestLogsTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders attemptedAt, translated result, origin, source/destination IP, status and attempts without Request ID in the main table', () => {
    const onView = vi.fn();
    render(
      <RequestLogsTable
        rows={rows}
        sortBy="attemptedAt"
        sortOrder="desc"
        onToggleSort={vi.fn()}
        onView={onView}
      />,
    );

    const expectedDate = new Intl.DateTimeFormat('en', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(rows[0].attemptedAt as string));

    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Internal')).toBeInTheDocument();
    expect(screen.getByText('177.1.1.1')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.20')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('502')).toBeInTheDocument();
    expect(screen.getByText('184 ms')).toBeInTheDocument();
    expect(screen.getByText('1.24 s')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Request ID')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(onView).toHaveBeenCalledWith(rows[0]);
  });

  it('defaults to showing most-recent-first with a descending sort indicator', () => {
    render(
      <RequestLogsTable
        rows={rows}
        sortBy="attemptedAt"
        sortOrder="desc"
        onToggleSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /Time/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(
      screen.getByRole('button', { name: /Sort by time: oldest to newest/ }),
    ).toBeInTheDocument();
  });

  it('toggles the sort direction when the Horário/Time header is clicked', () => {
    const onToggleSort = vi.fn();
    render(
      <RequestLogsTable
        rows={rows}
        sortBy="attemptedAt"
        sortOrder="desc"
        onToggleSort={onToggleSort}
        onView={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Sort by time: oldest to newest/ }));
    expect(onToggleSort).toHaveBeenCalledTimes(1);
  });

  it('shows an ascending sort indicator when sortOrder is asc', () => {
    render(
      <RequestLogsTable
        rows={rows}
        sortBy="attemptedAt"
        sortOrder="asc"
        onToggleSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /Time/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(
      screen.getByRole('button', { name: /Sort by time: newest to oldest/ }),
    ).toBeInTheDocument();
  });

  it('never sorts the given rows locally — renders them in the exact order received', () => {
    // `rows[1]` (log-2) is chronologically after `rows[0]` (log-1) but is
    // passed second here on purpose: the table must render server order
    // as-is, it must never re-sort by `attemptedAt` (or anything else)
    // client-side.
    render(
      <RequestLogsTable
        rows={rows}
        sortBy="attemptedAt"
        sortOrder="asc"
        onToggleSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    const renderedIds = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent);
    expect(renderedIds[0]).toContain('177.1.1.1');
    expect(renderedIds[1]).toContain('10.0.0.10');
  });

  it('does not show a directional indicator on the Horário column when a different field is the active sort', () => {
    render(
      <RequestLogsTable
        rows={rows}
        sortBy="durationMs"
        sortOrder="desc"
        onToggleSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    const columnHeader = screen.getByRole('columnheader', { name: /Time/ });
    expect(columnHeader).toHaveAttribute('aria-sort', 'none');
    // No lucide arrow icon (ArrowDown/ArrowUp) rendered inside the header button.
    expect(columnHeader.querySelector('svg')).not.toBeInTheDocument();
  });

  it('formats the attempted-at column as DD/MM/AAAA HH:mm:ss in pt-BR', async () => {
    await i18next.changeLanguage('pt-BR');

    // Built from local wall-clock components (07/08/2026 00:55:57) rather
    // than a fixed UTC string, so the assertion is exact yet independent of
    // the machine's timezone running the test — `.toISOString()` round-trips
    // through whatever UTC offset applies, and the table re-renders it back
    // in local time, which must reproduce the same digits.
    const attemptedAtDate = new Date(2026, 7, 7, 0, 55, 57);
    const rowsWithKnownTime = [{ ...rows[0], attemptedAt: attemptedAtDate.toISOString() }];

    render(
      <RequestLogsTable
        rows={rowsWithKnownTime}
        sortBy="attemptedAt"
        sortOrder="desc"
        onToggleSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('07/08/2026 00:55:57')).toBeInTheDocument();

    await i18next.changeLanguage('en');
  });
});
