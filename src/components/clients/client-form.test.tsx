import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CreateClientForm, EditClientForm } from '@/components/clients/client-form';
import type { Client } from '@/features/clients/clients.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const CLIENT: Client = {
  id: 'client-1',
  name: 'Acme Corp',
  code: 'acme-corp',
  description: null,
  contactName: null,
  contactEmail: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('CreateClientForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the empty hint when no name has been typed yet', () => {
    render(<CreateClientForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText('The identifier will be generated after you enter a name.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Identifier')).toHaveValue('');
  });

  it('generates a live read-only identifier preview from the name and never lets it be edited', () => {
    render(<CreateClientForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Empresa São José' } });

    const identifierField = screen.getByLabelText('Identifier');
    expect(identifierField).toHaveValue('empresa-sao-jose');
    expect(identifierField).toHaveAttribute('readonly');
    expect(identifierField).toBeDisabled();

    fireEvent.change(identifierField, { target: { value: 'hacked-value' } });
    expect(identifierField).toHaveValue('empresa-sao-jose');
  });

  it('submits successfully without sending a code and calls onSuccess with the created client', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/clients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: CLIENT,
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        });
      }),
    );

    const onSuccess = vi.fn();
    render(<CreateClientForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Acme Corp' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create client' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining(CLIENT)));
    expect(capturedBody).not.toHaveProperty('code');
  });

  it('shows the conflict error message on a duplicate name (409)', async () => {
    server.use(
      http.post(`${BASE}/clients`, () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 409,
            message: 'A client with this name already exists.',
            error: 'Conflict',
            path: '/api/v1/clients',
            method: 'POST',
            requestId: 'req-1',
            timestamp: '2026-08-06T12:00:00.000Z',
          },
          { status: 409 },
        ),
      ),
    );

    render(<CreateClientForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Acme Corp' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create client' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/conflict/i);
  });
});

describe('EditClientForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the existing identifier as read-only and does not change it when the name is edited', () => {
    render(<EditClientForm open client={CLIENT} onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    const identifierField = screen.getByLabelText('Identifier');
    expect(identifierField).toHaveValue('acme-corp');
    expect(identifierField).toHaveAttribute('readonly');
    expect(identifierField).toBeDisabled();
    expect(
      screen.getByText(
        'The identifier is set when the client is created and does not change when you edit the name.',
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed Corp' } });
    expect(identifierField).toHaveValue('acme-corp');
  });

  it('does not send a code field when saving changes', async () => {
    let capturedBody: unknown;
    server.use(
      http.patch(`${BASE}/clients/:id`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: { ...CLIENT, name: 'Renamed Corp' },
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        });
      }),
    );

    const onSuccess = vi.fn();
    render(<EditClientForm open client={CLIENT} onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed Corp' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).not.toHaveProperty('code');
  });
});
