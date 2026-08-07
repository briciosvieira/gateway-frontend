import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  CreateGatewayRouteForm,
  EditGatewayRouteForm,
} from '@/components/gateway-routes/gateway-route-form';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const ROUTE: GatewayRoute = {
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
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
  publicPath: '/gateway/send-whatsapp',
};

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Send WhatsApp' } });
  fireEvent.change(screen.getByLabelText('Slug'), { target: { value: '/send-whatsapp' } });
  fireEvent.change(screen.getByLabelText('Destination URL'), {
    target: { value: 'https://internal.example.com/api/whatsapp' },
  });
}

describe('CreateGatewayRouteForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows a validation error when no client is selected', async () => {
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    expect(await screen.findByText('Select a client.')).toBeInTheDocument();
  });

  it('shows a validation error for an invalid destination URL', async () => {
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Send WhatsApp' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: '/send-whatsapp' } });
    fireEvent.change(screen.getByLabelText('Destination URL'), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    expect(await screen.findByText('Enter a valid URL.')).toBeInTheDocument();
  });

  it('selects a client, submits, and calls onSuccess with the created route', async () => {
    server.use(
      http.get(`${BASE}/clients`, () =>
        HttpResponse.json(
          successBody({
            items: [{ id: 'client-1', name: 'Acme Corp', code: 'ACME' }],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.post(`${BASE}/gateway-routes`, () => HttpResponse.json(successBody(ROUTE))),
    );

    const onSuccess = vi.fn();
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.focus(screen.getByRole('combobox', { name: 'Client' }));
    fireEvent.click(await screen.findByRole('button', { name: /Acme Corp/ }));

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(ROUTE));
  });
});

describe('EditGatewayRouteForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('pre-fills the existing route values', () => {
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Send WhatsApp');
    expect(screen.getByLabelText('Slug')).toHaveValue('/send-whatsapp');
    expect(screen.getByLabelText('Destination URL')).toHaveValue(
      'https://internal.example.com/api/whatsapp',
    );
    expect(screen.getByLabelText('Timeout (ms)')).toHaveValue(30000);
    expect(screen.getByLabelText('Retry attempts')).toHaveValue(0);
  });

  it('sends only the changed fields on save', async () => {
    let capturedBody: unknown;
    server.use(
      http.patch(`${BASE}/gateway-routes/:id`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(successBody({ ...ROUTE, name: 'Send WhatsApp Renamed' }));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Send WhatsApp Renamed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ name: 'Send WhatsApp Renamed' });
  });
});
