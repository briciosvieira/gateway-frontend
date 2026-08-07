import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ApiKeyFilters } from '@/components/api-keys/api-key-filters';
import { DEFAULT_API_KEYS_FILTERS } from '@/features/api-keys/api-keys.constants';
import i18next from '@/lib/i18n';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ApiKeyFilters', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('calls onChange with the status filter and resets the page', () => {
    const onChange = vi.fn();
    render(
      <ApiKeyFilters value={DEFAULT_API_KEYS_FILTERS} onChange={onChange} onClear={() => {}} />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });

    expect(onChange).toHaveBeenCalledWith({ status: 'active', page: 1 });
  });

  it('calls onChange with onlyExpired=true when "Expired only" is selected', () => {
    const onChange = vi.fn();
    render(
      <ApiKeyFilters value={DEFAULT_API_KEYS_FILTERS} onChange={onChange} onClear={() => {}} />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText('Expiration'), { target: { value: 'expired' } });

    expect(onChange).toHaveBeenCalledWith({ onlyExpired: true, page: 1 });
  });

  it('disables "Clear filters" when filters match the default', () => {
    render(
      <ApiKeyFilters value={DEFAULT_API_KEYS_FILTERS} onChange={() => {}} onClear={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('enables and triggers "Clear filters" when a filter differs from the default', () => {
    const onClear = vi.fn();
    render(
      <ApiKeyFilters
        value={{ ...DEFAULT_API_KEYS_FILTERS, status: 'active' }}
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
      <ApiKeyFilters
        value={DEFAULT_API_KEYS_FILTERS}
        onChange={() => {}}
        onClear={() => {}}
        showClientFilter={false}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.queryByLabelText('Client')).not.toBeInTheDocument();
    // The rest of the filter bar (status/expiration/sort) remains available.
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('shows the client picker by default', () => {
    render(
      <ApiKeyFilters value={DEFAULT_API_KEYS_FILTERS} onChange={() => {}} onClear={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Client')).toBeInTheDocument();
  });
});
