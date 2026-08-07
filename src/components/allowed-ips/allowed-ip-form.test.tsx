import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CreateAllowedIpForm } from '@/components/allowed-ips/allowed-ip-form';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

describe('CreateAllowedIpForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows a validation error when no client is selected', async () => {
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('IP or CIDR'), {
      target: { value: '192.168.1.50/24' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    expect(await screen.findByText('Select a client.')).toBeInTheDocument();
  });

  it('selects a client, submits, and calls onSuccess with the backend-normalized address', async () => {
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
      http.post(`${BASE}/allowed-ips`, () =>
        HttpResponse.json(
          successBody({
            id: 'ip-1',
            clientId: 'client-1',
            address: '192.168.1.0/24',
            type: 'CIDR_IPV4',
            description: null,
            active: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
          }),
        ),
      ),
    );

    const onSuccess = vi.fn();
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('button', { name: /Acme Corp/ }));

    fireEvent.change(screen.getByLabelText('IP or CIDR'), {
      target: { value: '192.168.1.50/24' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ address: '192.168.1.0/24' }),
      ),
    );
  });
});
