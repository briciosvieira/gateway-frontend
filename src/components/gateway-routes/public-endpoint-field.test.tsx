import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicEndpointField } from '@/components/gateway-routes/public-endpoint-field';
import { env } from '@/config/env';

vi.mock('@/config/env', () => ({ env: { VITE_PUBLIC_GATEWAY_URL: undefined } }));

describe('PublicEndpointField', () => {
  it('falls back to the relative publicPath when VITE_PUBLIC_GATEWAY_URL is not configured', () => {
    render(<PublicEndpointField publicPath="/gateway/send-whatsapp" />);
    expect(screen.getByText('/gateway/send-whatsapp')).toBeInTheDocument();
  });

  it('builds the full URL from VITE_PUBLIC_GATEWAY_URL + the backend publicPath', () => {
    env.VITE_PUBLIC_GATEWAY_URL = 'https://gatewayhub.example.com';

    render(<PublicEndpointField publicPath="/gateway/send-whatsapp" />);
    expect(
      screen.getByText('https://gatewayhub.example.com/gateway/send-whatsapp'),
    ).toBeInTheDocument();

    env.VITE_PUBLIC_GATEWAY_URL = undefined;
  });
});
