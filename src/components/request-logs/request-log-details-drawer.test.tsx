import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import { RequestLogDetailsDrawer } from '@/components/request-logs/request-log-details-drawer';
import type { RequestLog } from '@/features/request-logs/request-logs.types';
import { formatRequestLogDateTime } from '@/features/request-logs/request-logs.utils';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const REQUEST_LOG: RequestLog = {
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
  destinationUrl: 'https://n8n.internal/webhook',
  destinationIp: '10.0.0.1',
  statusCode: 502,
  upstreamStatusCode: null,
  durationMs: 1240,
  attempts: 3,
  result: 'ERROR',
  errorCode: 'UPSTREAM_UNAVAILABLE',
  errorMessage: 'The upstream service is unavailable.',
  requestHeaders: {
    authorization: 'Bearer token',
    'x-api-key': 'plain-api-key',
  },
  requestQuery: null,
  requestBody: {
    password: 'super-secret',
    nested: { certificatePem: 'pem-data' },
  },
  responseHeaders: { 'content-type': 'application/json' },
  responseBody: { refreshToken: 'abcd', ok: false },
  requestSizeBytes: 16000,
  responseSizeBytes: 3400,
  createdAt: '2026-08-07T12:00:01.000Z',
  client: { id: 'client-1', name: 'Syngoo', code: 'syngoo' },
  apiKey: { id: 'api-key-1', name: 'Primary key' },
  gatewayRoute: { id: 'route-1', name: 'Webhook', slug: '/webhook', method: 'POST' },
};

const NULL_REQUEST_LOG: RequestLog = {
  ...REQUEST_LOG,
  id: 'log-2',
  requestId: 'req-2',
  requestOrigin: null,
  sourceHost: null,
  clientId: null,
  apiKeyId: null,
  gatewayRouteId: null,
  publicEndpoint: null,
  destinationHost: null,
  destinationUrl: null,
  destinationIp: null,
  upstreamStatusCode: null,
  requestHeaders: null,
  requestBody: null,
  responseHeaders: null,
  responseBody: null,
  client: null,
  apiKey: null,
  gatewayRoute: null,
};

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-07T12:00:00.000Z',
  };
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('RequestLogDetailsDrawer', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the full request flow, upstream status, destination URL, error and masked payloads', async () => {
    server.use(
      http.get(`${BASE}/request-logs/log-1`, () => HttpResponse.json(successBody(REQUEST_LOG))),
    );

    render(<RequestLogDetailsDrawer open requestLog={REQUEST_LOG} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByRole('heading', { name: 'Request log details' })).toBeInTheDocument();
    expect(screen.getByText('Request Flow')).toBeInTheDocument();
    expect(screen.getAllByText('https://n8n.internal/webhook').length).toBeGreaterThan(0);
    expect(screen.getByText('UPSTREAM_UNAVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('The upstream service is unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('Bearer token')).not.toBeInTheDocument();
    expect(screen.queryByText('plain-api-key')).not.toBeInTheDocument();
    expect(screen.queryByText('super-secret')).not.toBeInTheDocument();
    expect(screen.queryByText('pem-data')).not.toBeInTheDocument();
    expect(screen.queryByText('abcd')).not.toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes('"********"') ?? false)
        .length,
    ).toBeGreaterThan(0);
  });

  it('shows attemptedAt and createdAt separately, both via the shared central formatter', async () => {
    server.use(
      http.get(`${BASE}/request-logs/log-1`, () => HttpResponse.json(successBody(REQUEST_LOG))),
    );

    render(<RequestLogDetailsDrawer open requestLog={REQUEST_LOG} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    await screen.findByRole('heading', { name: 'Request log details' });

    const expectedAttemptedAt = formatRequestLogDateTime(REQUEST_LOG.attemptedAt, 'en');
    const expectedCreatedAt = formatRequestLogDateTime(REQUEST_LOG.createdAt, 'en');

    expect(screen.getByText('Attempted at')).toBeInTheDocument();
    expect(screen.getByText('Created at')).toBeInTheDocument();
    expect(screen.getByText(expectedAttemptedAt)).toBeInTheDocument();
    expect(screen.getByText(expectedCreatedAt)).toBeInTheDocument();
    // attemptedAt and createdAt are one second apart in the fixture — distinct rows, distinct values.
    expect(expectedAttemptedAt).not.toBe(expectedCreatedAt);
  });

  it('handles null routing and payload fields without breaking the drawer', async () => {
    server.use(
      http.get(`${BASE}/request-logs/log-2`, () =>
        HttpResponse.json(successBody(NULL_REQUEST_LOG)),
      ),
    );

    render(<RequestLogDetailsDrawer open requestLog={NULL_REQUEST_LOG} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByRole('heading', { name: 'Request log details' })).toBeInTheDocument();
    expect(screen.getAllByText('Not identified').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not called').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
  });
});
