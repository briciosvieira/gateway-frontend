import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ClientFilters } from '@/components/clients/client-filters';
import { DEFAULT_CLIENTS_FILTERS } from '@/features/clients/clients.constants';
import i18next from '@/lib/i18n';

describe('ClientFilters', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('calls onChange with the status filter and resets the page', () => {
    const onChange = vi.fn();
    render(
      <ClientFilters value={DEFAULT_CLIENTS_FILTERS} onChange={onChange} onClear={() => {}} />,
    );

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });

    expect(onChange).toHaveBeenCalledWith({ status: 'active', page: 1 });
  });

  it('calls onChange with the sort field', () => {
    const onChange = vi.fn();
    render(
      <ClientFilters value={DEFAULT_CLIENTS_FILTERS} onChange={onChange} onClear={() => {}} />,
    );

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'name' } });

    expect(onChange).toHaveBeenCalledWith({ sortBy: 'name', page: 1 });
  });

  it('disables "Clear filters" when filters match the default', () => {
    render(
      <ClientFilters value={DEFAULT_CLIENTS_FILTERS} onChange={() => {}} onClear={() => {}} />,
    );

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('enables and triggers "Clear filters" when a filter differs from the default', () => {
    const onClear = vi.fn();
    render(
      <ClientFilters
        value={{ ...DEFAULT_CLIENTS_FILTERS, status: 'active' }}
        onChange={() => {}}
        onClear={onClear}
      />,
    );

    const clearButton = screen.getByRole('button', { name: 'Clear filters' });
    expect(clearButton).not.toBeDisabled();

    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
