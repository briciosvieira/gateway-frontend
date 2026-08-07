import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CreateApiKeyForm } from '@/components/api-keys/api-key-form';
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

describe('CreateApiKeyForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows a validation error when no client is selected', async () => {
    render(<CreateApiKeyForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Integration Key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create API Key' }));

    expect(await screen.findByText('Select a client.')).toBeInTheDocument();
  });

  it('selects a client via the combobox, submits, and calls onSuccess with the plaintext key', async () => {
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
      http.post(`${BASE}/api-keys`, () =>
        HttpResponse.json(
          successBody({
            apiKey: {
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
            },
            key: 'ghlf_a83f2d1c_secretvalue',
            warning: 'Store this API Key securely. It will not be displayed again.',
          }),
        ),
      ),
    );

    const onSuccess = vi.fn();
    render(<CreateApiKeyForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('button', { name: /Acme Corp/ }));

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Integration Key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create API Key' }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'ghlf_a83f2d1c_secretvalue' }),
      ),
    );
  });
});
