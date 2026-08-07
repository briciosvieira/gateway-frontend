import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import {
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardFilterState,
} from '@/features/dashboard/dashboard.types';
import i18next from '@/lib/i18n';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function ControlledFilters({ initial }: { initial: DashboardFilterState }) {
  const [value, setValue] = useState(initial);
  return <DashboardFilters value={value} onChange={setValue} />;
}

describe('DashboardFilters', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the custom date range only when period is set to custom', () => {
    render(<ControlledFilters initial={DEFAULT_DASHBOARD_FILTERS} />, { wrapper: createWrapper() });

    expect(screen.queryByLabelText('Start date')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Period'), { target: { value: 'custom' } });

    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
  });

  it('disables "Clear filters" when no filter differs from the default', () => {
    render(<ControlledFilters initial={DEFAULT_DASHBOARD_FILTERS} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('resets to the default filters when "Clear filters" is clicked', () => {
    render(<ControlledFilters initial={{ ...DEFAULT_DASHBOARD_FILTERS, period: 'last30days' }} />, {
      wrapper: createWrapper(),
    });

    const clearButton = screen.getByRole('button', { name: 'Clear filters' });
    expect(clearButton).not.toBeDisabled();

    fireEvent.click(clearButton);

    expect(screen.getByLabelText('Period')).toHaveValue(DEFAULT_DASHBOARD_FILTERS.period);
  });

  it('shows the "not applied to metrics" note once a client is selected', () => {
    render(
      <ControlledFilters
        initial={{
          ...DEFAULT_DASHBOARD_FILTERS,
          client: { id: 'c1', name: 'Acme', code: 'ACME' },
        }}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText(/Client, route and status filters are not yet applied/i),
    ).toBeInTheDocument();
  });

  it('does not show the note when no client/route/status is selected', () => {
    render(<ControlledFilters initial={DEFAULT_DASHBOARD_FILTERS} />, { wrapper: createWrapper() });

    expect(
      screen.queryByText(/Client, route and status filters are not yet applied/i),
    ).not.toBeInTheDocument();
  });
});
