import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CreateGatewayRouteForm,
  EditGatewayRouteForm,
} from '@/components/gateway-routes/gateway-route-form';
import type { AuthenticatedUser, RoleCode } from '@/features/auth/auth.types';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

let mockRoleCode: RoleCode = 'ADMIN';

function makeUser(role: RoleCode): AuthenticatedUser {
  return {
    id: 'user-1',
    name: 'Test User',
    username: 'test.user',
    email: 'test.user@example.com',
    active: true,
    firstLogin: false,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    role: { id: 'role-1', code: role, name: role, level: role === 'ADMIN' ? 100 : 50 },
  };
}

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ user: makeUser(mockRoleCode) }),
}));

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
  requiresApiKey: true,
  requiresAllowedIp: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
  publicPath: '/gateway/send-whatsapp',
};

const ROUTE_NO_API_KEY: GatewayRoute = { ...ROUTE, requiresApiKey: false };
const ROUTE_NO_ALLOWED_IP: GatewayRoute = { ...ROUTE, requiresAllowedIp: false };

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

function mockClientsAndCreate(responseRoute: GatewayRoute) {
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
    http.post(`${BASE}/gateway-routes`, () => HttpResponse.json(successBody(responseRoute))),
  );
}

async function selectClientAndFill() {
  fireEvent.focus(screen.getByRole('combobox', { name: 'Client' }));
  fireEvent.click(await screen.findByRole('button', { name: /Acme Corp/ }));
  fillRequiredFields();
}

describe('CreateGatewayRouteForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    mockRoleCode = 'ADMIN';
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
    mockClientsAndCreate(ROUTE);

    const onSuccess = vi.fn();
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    await selectClientAndFill();
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(ROUTE));
  });

  it('defaults requiresApiKey to checked (true) and sends it as true when untouched', async () => {
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
      http.post(`${BASE}/gateway-routes`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(ROUTE));
      }),
    );

    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText('Require X-API-Key')).toBeChecked();

    await selectClientAndFill();
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    await waitFor(() => expect(capturedBody?.requiresApiKey).toBe(true));
  });

  it('lets ADMIN see an editable requiresApiKey control', () => {
    mockRoleCode = 'ADMIN';
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText('Require X-API-Key')).not.toBeDisabled();
  });

  it('disables the requiresApiKey control for OPERATOR, keeping it checked', () => {
    mockRoleCode = 'OPERATOR';
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    const checkbox = screen.getByLabelText('Require X-API-Key');
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
  });

  it('opens a confirmation before creating a route with requiresApiKey unchecked (ADMIN)', async () => {
    mockClientsAndCreate(ROUTE_NO_API_KEY);

    const onSuccess = vi.fn();
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    await selectClientAndFill();
    fireEvent.click(screen.getByLabelText('Require X-API-Key'));
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    expect(await screen.findByText('Disable API Key authentication?')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Disable authentication' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(ROUTE_NO_API_KEY));
  });

  it('defaults requiresAllowedIp to checked (true) and sends it as true when untouched', async () => {
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
      http.post(`${BASE}/gateway-routes`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(ROUTE));
      }),
    );

    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText('Restrict by IP/DNS')).toBeChecked();

    await selectClientAndFill();
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    await waitFor(() => expect(capturedBody?.requiresAllowedIp).toBe(true));
  });

  it('lets an OPERATOR uncheck requiresAllowedIp with no confirmation dialog (no permission gate)', async () => {
    mockRoleCode = 'OPERATOR';
    mockClientsAndCreate(ROUTE_NO_ALLOWED_IP);

    const onSuccess = vi.fn();
    render(<CreateGatewayRouteForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    const checkbox = screen.getByLabelText('Restrict by IP/DNS');
    expect(checkbox).not.toBeDisabled();

    await selectClientAndFill();
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    expect(screen.queryByText('Disable API Key authentication?')).not.toBeInTheDocument();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(ROUTE_NO_ALLOWED_IP));
  });
});

describe('EditGatewayRouteForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    mockRoleCode = 'ADMIN';
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

  it('loads requiresApiKey=true exactly as returned by the backend', () => {
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Require X-API-Key')).toBeChecked();
  });

  it('loads requiresApiKey=false exactly as returned by the backend, never assuming true', () => {
    render(
      <EditGatewayRouteForm
        open
        route={ROUTE_NO_API_KEY}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Require X-API-Key')).not.toBeChecked();
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

  it('OPERATOR editing an unrelated field never sends requiresApiKey, even when the route already has it false', async () => {
    mockRoleCode = 'OPERATOR';
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.patch(`${BASE}/gateway-routes/:id`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody({ ...ROUTE_NO_API_KEY, name: 'Renamed' }));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditGatewayRouteForm
        open
        route={ROUTE_NO_API_KEY}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Require X-API-Key')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ name: 'Renamed' });
  });

  it('ADMIN changing requiresApiKey true → false opens a warning confirmation before saving', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.patch(`${BASE}/gateway-routes/:id`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(ROUTE_NO_API_KEY));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByLabelText('Require X-API-Key'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Disable API Key authentication?')).toBeInTheDocument();
    expect(capturedBody).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Disable authentication' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ requiresApiKey: false });
  });

  it('ADMIN changing requiresApiKey false → true opens a plain confirmation before saving', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.patch(`${BASE}/gateway-routes/:id`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(ROUTE));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditGatewayRouteForm
        open
        route={ROUTE_NO_API_KEY}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByLabelText('Require X-API-Key'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Enable API Key authentication?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enable authentication' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ requiresApiKey: true });
  });

  it('loads requiresAllowedIp=true exactly as returned by the backend', () => {
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Restrict by IP/DNS')).toBeChecked();
  });

  it('loads requiresAllowedIp=false exactly as returned by the backend, never assuming true', () => {
    render(
      <EditGatewayRouteForm
        open
        route={ROUTE_NO_ALLOWED_IP}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Restrict by IP/DNS')).not.toBeChecked();
  });

  it('ADMIN changing requiresAllowedIp saves immediately, with no confirmation dialog', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.patch(`${BASE}/gateway-routes/:id`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(ROUTE_NO_ALLOWED_IP));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByLabelText('Restrict by IP/DNS'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.queryByText('Disable API Key authentication?')).not.toBeInTheDocument();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ requiresAllowedIp: false });
  });

  it('OPERATOR can toggle requiresAllowedIp too (no permission gate), unlike requiresApiKey', async () => {
    mockRoleCode = 'OPERATOR';
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.patch(`${BASE}/gateway-routes/:id`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(ROUTE_NO_ALLOWED_IP));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    const allowedIpCheckbox = screen.getByLabelText('Restrict by IP/DNS');
    expect(allowedIpCheckbox).not.toBeDisabled();

    fireEvent.click(allowedIpCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ requiresAllowedIp: false });
  });

  it('leaves requiresAllowedIp out of the payload when only an unrelated field changes', async () => {
    let capturedBody: unknown;
    server.use(
      http.patch(`${BASE}/gateway-routes/:id`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(successBody({ ...ROUTE, name: 'Renamed' }));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <EditGatewayRouteForm open route={ROUTE} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capturedBody).toEqual({ name: 'Renamed' });
  });
});
