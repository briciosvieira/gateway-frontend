import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { GatewayRouteDetailsDrawer } from '@/components/gateway-routes/gateway-route-details-drawer';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import i18next from '@/lib/i18n';

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

describe('GatewayRouteDetailsDrawer', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows "X-API-Key required" for a route with requiresApiKey=true', () => {
    render(<GatewayRouteDetailsDrawer open route={ROUTE} onOpenChange={() => {}} />);

    expect(screen.getByText('X-API-Key required')).toBeInTheDocument();
    expect(screen.queryByText('X-API-Key disabled')).not.toBeInTheDocument();
  });

  it('shows "X-API-Key disabled" plus an explanatory description for requiresApiKey=false', () => {
    render(
      <GatewayRouteDetailsDrawer
        open
        route={{ ...ROUTE, requiresApiKey: false }}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText('X-API-Key disabled')).toBeInTheDocument();
    expect(
      screen.getByText(
        "This route accepts requests without an API Key. The Gateway's other protections still apply.",
      ),
    ).toBeInTheDocument();
  });

  it('shows "IP/DNS restricted" for a route with requiresAllowedIp=true', () => {
    render(<GatewayRouteDetailsDrawer open route={ROUTE} onOpenChange={() => {}} />);

    expect(screen.getByText('IP/DNS restricted')).toBeInTheDocument();
    expect(screen.queryByText('Any origin')).not.toBeInTheDocument();
  });

  it('shows "Any origin" plus an explanatory description for requiresAllowedIp=false', () => {
    render(
      <GatewayRouteDetailsDrawer
        open
        route={{ ...ROUTE, requiresAllowedIp: false }}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText('Any origin')).toBeInTheDocument();
    expect(
      screen.getByText(
        "This route accepts requests from any source IP. The Gateway's other protections still apply.",
      ),
    ).toBeInTheDocument();
  });
});
