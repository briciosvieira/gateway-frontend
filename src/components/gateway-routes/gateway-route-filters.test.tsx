import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { GatewayRouteFilters } from '@/components/gateway-routes/gateway-route-filters';
import { DEFAULT_GATEWAY_ROUTES_FILTERS } from '@/features/gateway-routes/gateway-routes.constants';
import i18next from '@/lib/i18n';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('GatewayRouteFilters', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('calls onChange with the method filter and resets the page', () => {
    const onChange = vi.fn();
    render(
      <GatewayRouteFilters
        value={DEFAULT_GATEWAY_ROUTES_FILTERS}
        onChange={onChange}
        onClear={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText('Method'), { target: { value: 'POST' } });

    expect(onChange).toHaveBeenCalledWith({ method: 'POST', page: 1 });
  });

  it('calls onChange with the status filter and resets the page', () => {
    const onChange = vi.fn();
    render(
      <GatewayRouteFilters
        value={DEFAULT_GATEWAY_ROUTES_FILTERS}
        onChange={onChange}
        onClear={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });

    expect(onChange).toHaveBeenCalledWith({ status: 'active', page: 1 });
  });

  it('disables "Clear filters" when filters match the default', () => {
    render(
      <GatewayRouteFilters
        value={DEFAULT_GATEWAY_ROUTES_FILTERS}
        onChange={() => {}}
        onClear={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('enables and triggers "Clear filters" when a filter differs from the default', () => {
    const onClear = vi.fn();
    render(
      <GatewayRouteFilters
        value={{ ...DEFAULT_GATEWAY_ROUTES_FILTERS, status: 'active' }}
        onChange={() => {}}
        onClear={onClear}
      />,
      { wrapper: createWrapper() },
    );

    const clearButton = screen.getByRole('button', { name: 'Clear filters' });
    expect(clearButton).not.toBeDisabled();

    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('hides the client picker when showClientFilter is false (client already fixed by a drawer)', () => {
    render(
      <GatewayRouteFilters
        value={DEFAULT_GATEWAY_ROUTES_FILTERS}
        onChange={() => {}}
        onClear={() => {}}
        showClientFilter={false}
      />,
      { wrapper: createWrapper() },
    );

    // Not queryByRole('combobox') — the Method <select> also has an
    // implicit combobox role and would produce a false "still found" pass.
    expect(screen.queryByLabelText('Client')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Method')).toBeInTheDocument();
  });

  it('shows the client picker by default', () => {
    render(
      <GatewayRouteFilters
        value={DEFAULT_GATEWAY_ROUTES_FILTERS}
        onChange={() => {}}
        onClear={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Client')).toBeInTheDocument();
  });
});
