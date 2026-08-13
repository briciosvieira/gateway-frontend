import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CreateAllowedIpForm, EditAllowedIpForm } from '@/components/allowed-ips/allowed-ip-form';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';
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

function selectSourceType(selectId: string, label: string) {
  fireEvent.change(document.getElementById(selectId)!, { target: { value: label } });
}

const HOSTNAME_ALLOWED_IP: AllowedIp = {
  id: 'ip-2',
  clientId: 'client-1',
  address: 'api.cliente.com.br',
  type: 'HOSTNAME',
  description: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
};

function mockClients() {
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
  );
}

function mockClientsAndCreate(responseAllowedIp: unknown) {
  mockClients();
  server.use(
    http.post(`${BASE}/allowed-ips`, () => HttpResponse.json(successBody(responseAllowedIp))),
  );
}

async function selectClient() {
  fireEvent.focus(screen.getByRole('combobox', { name: 'Client' }));
  fireEvent.click(await screen.findByRole('button', { name: /Acme Corp/ }));
}

describe('CreateAllowedIpForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows a validation error when no client is selected', async () => {
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '192.168.1.50/24' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    expect(await screen.findByText('Select a client.')).toBeInTheDocument();
  });

  it('selects a client, submits, and calls onSuccess with the backend-normalized address', async () => {
    mockClientsAndCreate({
      id: 'ip-1',
      clientId: 'client-1',
      address: '192.168.1.0/24',
      type: 'CIDR_IPV4',
      description: null,
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
    });

    const onSuccess = vi.fn();
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    await selectClient();

    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '192.168.1.50/24' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ address: '192.168.1.0/24' }),
      ),
    );
  });

  it('shows IP/CIDR/DNS as the allowed source type options, defaulting to IP', () => {
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    const select = screen.getByLabelText('Allowed source type') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((option) => option.textContent);
    expect(optionLabels).toEqual(['IP', 'CIDR', 'DNS']);
    expect(select.value).toBe('IP');
    expect(screen.getByLabelText('IP address')).toBeInTheDocument();
  });

  it('switches the address label and placeholder when DNS is selected', () => {
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    selectSourceType('create-allowed-ip-source-type', 'DNS');

    const field = screen.getByLabelText('Hostname / DNS');
    expect(field).toHaveAttribute('placeholder', 'api.cliente.com.br');
    expect(
      screen.getByText(
        'The Gateway resolves this hostname to its current IP addresses and allows requests originating from those addresses.',
      ),
    ).toBeInTheDocument();
  });

  it('switches the address label and placeholder when CIDR is selected', () => {
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    selectSourceType('create-allowed-ip-source-type', 'CIDR');

    const field = screen.getByLabelText('CIDR network');
    expect(field).toHaveAttribute('placeholder', '177.207.247.0/24');
  });

  it('accepts a valid bare hostname and sends type=HOSTNAME via the backend-derived response', async () => {
    mockClientsAndCreate(HOSTNAME_ALLOWED_IP);

    const onSuccess = vi.fn();
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    await selectClient();
    selectSourceType('create-allowed-ip-source-type', 'DNS');
    fireEvent.change(screen.getByLabelText('Hostname / DNS'), {
      target: { value: 'api.cliente.com.br' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ type: 'HOSTNAME' })),
    );
  });

  it('sends only address/clientId/description — never a type field — even for DNS', async () => {
    let capturedBody: Record<string, unknown> | undefined;
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
      http.post(`${BASE}/allowed-ips`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(HOSTNAME_ALLOWED_IP));
      }),
    );

    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    await selectClient();
    selectSourceType('create-allowed-ip-source-type', 'DNS');
    fireEvent.change(screen.getByLabelText('Hostname / DNS'), {
      target: { value: 'API.CLIENTE.com.br' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    await waitFor(() => expect(capturedBody).toBeDefined());
    expect(capturedBody).toEqual({ address: 'api.cliente.com.br', clientId: 'client-1' });
  });

  it('rejects a hostname with a protocol (https://) without calling the backend', async () => {
    mockClients();
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    await selectClient();
    selectSourceType('create-allowed-ip-source-type', 'DNS');
    fireEvent.change(screen.getByLabelText('Hostname / DNS'), {
      target: { value: 'https://api.cliente.com.br' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    expect(
      await screen.findByText('Enter only the hostname, without protocol, port, or path.'),
    ).toBeInTheDocument();
  });

  it('rejects a hostname with a path without calling the backend', async () => {
    mockClients();
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    await selectClient();
    selectSourceType('create-allowed-ip-source-type', 'DNS');
    fireEvent.change(screen.getByLabelText('Hostname / DNS'), {
      target: { value: 'api.cliente.com.br/path' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    expect(
      await screen.findByText('Enter only the hostname, without protocol, port, or path.'),
    ).toBeInTheDocument();
  });

  it('rejects a hostname with a port without calling the backend', async () => {
    mockClients();
    render(<CreateAllowedIpForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    await selectClient();
    selectSourceType('create-allowed-ip-source-type', 'DNS');
    fireEvent.change(screen.getByLabelText('Hostname / DNS'), {
      target: { value: 'api.cliente.com.br:443' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    expect(
      await screen.findByText('Enter only the hostname, without protocol, port, or path.'),
    ).toBeInTheDocument();
  });

  it('creates from within a client drawer with the client already locked (clientId preserved)', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.post(`${BASE}/allowed-ips`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(HOSTNAME_ALLOWED_IP));
      }),
    );

    render(
      <CreateAllowedIpForm
        open
        onOpenChange={() => {}}
        onSuccess={() => {}}
        lockedClient={{ id: 'client-1', name: 'Acme Corp', code: 'ACME' }}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Acme Corp (ACME)')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Client' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('IP address'), { target: { value: '10.0.0.1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    await waitFor(() => expect(capturedBody?.clientId).toBe('client-1'));
  });
});

describe('EditAllowedIpForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('loads type=HOSTNAME as DNS, showing the real address exactly as returned by the backend', () => {
    render(
      <EditAllowedIpForm
        open
        allowedIp={HOSTNAME_ALLOWED_IP}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect((screen.getByLabelText('Allowed source type') as HTMLSelectElement).value).toBe('DNS');
    expect(screen.getByLabelText('Hostname / DNS')).toHaveValue('api.cliente.com.br');
  });

  it('loads type=CIDR_IPV4 as CIDR, never assuming IP', () => {
    render(
      <EditAllowedIpForm
        open
        allowedIp={{ ...HOSTNAME_ALLOWED_IP, type: 'CIDR_IPV4', address: '10.0.0.0/24' }}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect((screen.getByLabelText('Allowed source type') as HTMLSelectElement).value).toBe('CIDR');
    expect(screen.getByLabelText('CIDR network')).toHaveValue('10.0.0.0/24');
  });

  it('sends only the changed fields on save', async () => {
    let capturedBody: unknown;
    server.use(
      http.patch(`${BASE}/allowed-ips/:id`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(successBody({ ...HOSTNAME_ALLOWED_IP, description: 'Updated' }));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditAllowedIpForm
        open
        allowedIp={HOSTNAME_ALLOWED_IP}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ description: 'Updated' });
  });
});
