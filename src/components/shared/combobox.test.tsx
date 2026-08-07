import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from '@/components/shared/combobox';

interface Option {
  id: string;
  name: string;
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('Combobox', () => {
  it('does not fetch options until the input is focused', () => {
    const useOptions = vi.fn().mockReturnValue({ data: [], isLoading: false });

    render(
      <Combobox<Option>
        label="Client"
        placeholder="Search client..."
        emptyMessage="No clients found"
        value={null}
        onChange={() => {}}
        useOptions={useOptions}
        getOptionLabel={(option) => option.name}
        getOptionId={(option) => option.id}
      />,
      { wrapper: createWrapper() },
    );

    expect(useOptions).toHaveBeenCalledWith('', false);
  });

  it('opens the listbox and lists options once focused', async () => {
    const useOptions = vi
      .fn()
      .mockReturnValue({ data: [{ id: 'c1', name: 'Acme' }], isLoading: false });

    render(
      <Combobox<Option>
        label="Client"
        placeholder="Search client..."
        emptyMessage="No clients found"
        value={null}
        onChange={() => {}}
        useOptions={useOptions}
        getOptionLabel={(option) => option.name}
        getOptionId={(option) => option.id}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.focus(screen.getByRole('combobox'));

    await waitFor(() => expect(useOptions).toHaveBeenCalledWith('', true));
    expect(screen.getByRole('option', { name: 'Acme' })).toBeInTheDocument();
  });

  it('calls onChange and closes the listbox when an option is selected', async () => {
    const onChange = vi.fn();
    const useOptions = vi
      .fn()
      .mockReturnValue({ data: [{ id: 'c1', name: 'Acme' }], isLoading: false });

    render(
      <Combobox<Option>
        label="Client"
        placeholder="Search client..."
        emptyMessage="No clients found"
        value={null}
        onChange={onChange}
        useOptions={useOptions}
        getOptionLabel={(option) => option.name}
        getOptionId={(option) => option.id}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('button', { name: 'Acme' }));

    expect(onChange).toHaveBeenCalledWith({ id: 'c1', name: 'Acme' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a clear button and calls onChange with null when clicked', () => {
    const onChange = vi.fn();
    const useOptions = vi.fn().mockReturnValue({ data: [], isLoading: false });

    render(
      <Combobox<Option>
        label="Client"
        placeholder="Search client..."
        emptyMessage="No clients found"
        value={{ id: 'c1', name: 'Acme' }}
        onChange={onChange}
        useOptions={useOptions}
        getOptionLabel={(option) => option.name}
        getOptionId={(option) => option.id}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('combobox')).toHaveValue('Acme');

    fireEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
