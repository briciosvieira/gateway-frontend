import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { RequestLogListItem } from '@/features/request-logs/request-logs.types';
import i18next from '@/lib/i18n';
import { RequestLogsPage } from '@/pages/request-logs/request-logs-page';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-07T12:00:00.000Z',
  };
}

function buildLog(overrides: Partial<RequestLogListItem>): RequestLogListItem {
  return {
    id: 'log-default',
    requestId: 'req-default',
    attemptedAt: '2026-08-07T00:00:00.000Z',
    requestOrigin: 'PUBLIC',
    sourceHost: 'hub.example.com',
    clientId: null,
    apiKeyId: null,
    gatewayRouteId: null,
    sourceIp: '10.0.0.1',
    method: 'GET',
    publicPath: '/gateway/example',
    publicEndpoint: null,
    destinationHost: null,
    destinationIp: null,
    statusCode: 200,
    durationMs: 10,
    attempts: 1,
    result: 'SUCCESS',
    errorCode: null,
    errorMessage: null,
    requestSizeBytes: null,
    responseSizeBytes: null,
    createdAt: '2026-08-07T00:00:01.000Z',
    client: null,
    apiKey: null,
    gatewayRoute: null,
    ...overrides,
  };
}

// Deliberately spans a day boundary (06/08 -> 07/08), in real DESC
// (most-recent-first) server order — the frontend must render this exactly
// as received, never re-sort it client-side.
const DESC_ROWS = [
  buildLog({ id: 'log-1', sourceIp: '10.0.0.101', attemptedAt: '2026-08-07T00:55:57.000Z' }),
  buildLog({ id: 'log-2', sourceIp: '10.0.0.102', attemptedAt: '2026-08-07T00:55:51.000Z' }),
  buildLog({ id: 'log-3', sourceIp: '10.0.0.103', attemptedAt: '2026-08-07T00:55:42.000Z' }),
  buildLog({ id: 'log-4', sourceIp: '10.0.0.104', attemptedAt: '2026-08-06T23:58:32.000Z' }),
];

const ASC_ROWS = [...DESC_ROWS].reverse();

function paginatedBody(items: RequestLogListItem[], total = items.length) {
  return successBody({
    items,
    pagination: { page: 1, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
  });
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderPage() {
  return render(<RequestLogsPage />, { wrapper: createWrapper() });
}

function sourceIpsInOrder() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent);
}

describe('RequestLogsPage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('defaults to sortBy=attemptedAt&sortOrder=desc and renders server order as-is, respecting the day rollover', async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/request-logs`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(paginatedBody(DESC_ROWS));
      }),
    );

    renderPage();

    await screen.findByText('10.0.0.101');

    expect(requestUrl?.searchParams.get('sortBy')).toBe('attemptedAt');
    expect(requestUrl?.searchParams.get('sortOrder')).toBe('desc');

    const order = sourceIpsInOrder();
    expect(order[0]).toContain('10.0.0.101');
    expect(order[1]).toContain('10.0.0.102');
    expect(order[2]).toContain('10.0.0.103');
    expect(order[3]).toContain('10.0.0.104');
  });

  it('toggling to ascending re-queries the backend and renders its (oldest-first) order, never a local re-sort', async () => {
    server.use(
      http.get(`${BASE}/request-logs`, ({ request }) => {
        const url = new URL(request.url);
        const sortOrder = url.searchParams.get('sortOrder');
        return HttpResponse.json(paginatedBody(sortOrder === 'asc' ? ASC_ROWS : DESC_ROWS));
      }),
    );

    renderPage();
    await screen.findByText('10.0.0.101');

    fireEvent.click(screen.getByRole('button', { name: /Sort by time: oldest to newest/ }));

    // `10.0.0.104` is present in both DESC and ASC responses (just at a
    // different position), so waiting for its mere presence isn't enough —
    // wait for it to actually become the first row before asserting order.
    await vi.waitFor(() => expect(sourceIpsInOrder()[0]).toContain('10.0.0.104'));
    const order = sourceIpsInOrder();
    expect(order[0]).toContain('10.0.0.104');
    expect(order[1]).toContain('10.0.0.103');
    expect(order[2]).toContain('10.0.0.102');
    expect(order[3]).toContain('10.0.0.101');
  });

  it('sends local-day boundary ISO instants for a same-day startDate/endDate filter', async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/request-logs`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(paginatedBody(DESC_ROWS));
      }),
    );

    renderPage();
    await screen.findByText('10.0.0.101');

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-08-07' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-08-07' } });

    await screen.findByText('10.0.0.101');

    const sentStart = new Date(requestUrl?.searchParams.get('startDate') as string);
    const sentEnd = new Date(requestUrl?.searchParams.get('endDate') as string);

    expect(sentStart.getDate()).toBe(7);
    expect(sentStart.getHours()).toBe(0);
    expect(sentStart.getMinutes()).toBe(0);
    expect(sentStart.getSeconds()).toBe(0);

    expect(sentEnd.getDate()).toBe(7);
    expect(sentEnd.getHours()).toBe(23);
    expect(sentEnd.getMinutes()).toBe(59);
    expect(sentEnd.getSeconds()).toBe(59);

    // Same day for both ends is a valid range — no blocking error shown.
    expect(
      screen.queryByText('Start date must be less than or equal to end date.'),
    ).not.toBeInTheDocument();
  });

  it('toggles sort direction desc -> asc -> desc, always keeping sortBy=attemptedAt', async () => {
    // Asserting on `aria-sort` (driven directly by React state) and on the
    // eventual row order — rather than on raw request arrival order — since
    // two fast consecutive toggles can let in-flight responses settle out
    // of order; the rendered state always converges correctly regardless.
    const sentSortBys: Array<string | null> = [];
    server.use(
      http.get(`${BASE}/request-logs`, ({ request }) => {
        const url = new URL(request.url);
        sentSortBys.push(url.searchParams.get('sortBy'));
        const sortOrder = url.searchParams.get('sortOrder');
        return HttpResponse.json(paginatedBody(sortOrder === 'asc' ? ASC_ROWS : DESC_ROWS));
      }),
    );

    renderPage();
    await screen.findByText('10.0.0.101');
    expect(screen.getByRole('columnheader', { name: /Time/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );

    fireEvent.click(screen.getByRole('button', { name: /Sort by time/ }));
    await vi.waitFor(() =>
      expect(screen.getByRole('columnheader', { name: /Time/ })).toHaveAttribute(
        'aria-sort',
        'ascending',
      ),
    );
    await vi.waitFor(() => expect(sourceIpsInOrder()[0]).toContain('10.0.0.104'));

    fireEvent.click(screen.getByRole('button', { name: /Sort by time/ }));
    await vi.waitFor(() =>
      expect(screen.getByRole('columnheader', { name: /Time/ })).toHaveAttribute(
        'aria-sort',
        'descending',
      ),
    );
    await vi.waitFor(() => expect(sourceIpsInOrder()[0]).toContain('10.0.0.101'));

    expect(sentSortBys.every((value) => value === 'attemptedAt')).toBe(true);
  });

  it('blocks the query and shows an error when startDate is after endDate', async () => {
    let requestCount = 0;
    server.use(
      http.get(`${BASE}/request-logs`, () => {
        requestCount += 1;
        return HttpResponse.json(paginatedBody(DESC_ROWS));
      }),
    );

    renderPage();
    await screen.findByText('10.0.0.101');
    const countAfterInitialLoad = requestCount;

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-08-01' } });

    expect(
      await screen.findByText('Start date must be less than or equal to end date.'),
    ).toBeInTheDocument();
    // No additional request was fired for the invalid range.
    expect(requestCount).toBe(countAfterInitialLoad);
  });

  it('resets to page 1 when a filter changes after navigating to page 2', async () => {
    let lastPage: string | null = null;
    server.use(
      http.get(`${BASE}/request-logs`, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(paginatedBody(DESC_ROWS, 40));
      }),
    );

    renderPage();
    await screen.findByText('10.0.0.101');
    expect(lastPage).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('10.0.0.101');
    expect(lastPage).toBe('2');

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'durationMs' } });
    await screen.findByText('10.0.0.101');
    expect(lastPage).toBe('1');
  });

  it('resets to page 1 when the date range changes after navigating to page 2', async () => {
    let lastPage: string | null = null;
    server.use(
      http.get(`${BASE}/request-logs`, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(paginatedBody(DESC_ROWS, 40));
      }),
    );

    renderPage();
    await screen.findByText('10.0.0.101');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('10.0.0.101');
    expect(lastPage).toBe('2');

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-08-07' } });
    await screen.findByText('10.0.0.101');
    expect(lastPage).toBe('1');
  });

  it('changes the query key (and refetches) when startDate/endDate/sort change', async () => {
    let requestCount = 0;
    server.use(
      http.get(`${BASE}/request-logs`, () => {
        requestCount += 1;
        return HttpResponse.json(paginatedBody(DESC_ROWS));
      }),
    );

    renderPage();
    await screen.findByText('10.0.0.101');
    const afterInitial = requestCount;

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-08-01' } });
    await screen.findByText('10.0.0.101');
    expect(requestCount).toBeGreaterThan(afterInitial);
    const afterStartDate = requestCount;

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'statusCode' } });
    await screen.findByText('10.0.0.101');
    expect(requestCount).toBeGreaterThan(afterStartDate);
  });
});
