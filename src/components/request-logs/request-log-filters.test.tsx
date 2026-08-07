import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { RequestLogFilters } from '@/components/request-logs/request-log-filters';
import { DEFAULT_REQUEST_LOG_FILTERS } from '@/features/request-logs/request-logs.constants';
import i18next from '@/lib/i18n';

describe('RequestLogFilters', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('sends the raw YYYY-MM-DD value from the date inputs and resets the page', () => {
    const onChange = vi.fn();
    render(
      <RequestLogFilters
        value={DEFAULT_REQUEST_LOG_FILTERS}
        dateRangeError={null}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-08-07' } });
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-08-07', page: 1 });

    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-08-07' } });
    expect(onChange).toHaveBeenCalledWith({ endDate: '2026-08-07', page: 1 });
  });

  it('shows the date range error message when given one, without blocking rendering of the filters', () => {
    render(
      <RequestLogFilters
        value={{ ...DEFAULT_REQUEST_LOG_FILTERS, startDate: '2026-08-10', endDate: '2026-08-01' }}
        dateRangeError="Start date must be less than or equal to end date."
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Start date must be less than or equal to end date.'),
    ).toBeInTheDocument();
  });

  it('offers Sort by (attemptedAt/durationMs/statusCode/createdAt) and Direction, and maps "Attempted at" to attemptedAt', () => {
    const onChange = vi.fn();
    render(
      <RequestLogFilters
        value={DEFAULT_REQUEST_LOG_FILTERS}
        dateRangeError={null}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );

    const sortBySelect = screen.getByLabelText('Sort by') as HTMLSelectElement;
    const optionLabels = Array.from(sortBySelect.options).map((option) => option.textContent);
    expect(optionLabels).toEqual(['Attempted at', 'Duration', 'HTTP status', 'Created at']);

    fireEvent.change(sortBySelect, { target: { value: 'durationMs' } });
    expect(onChange).toHaveBeenCalledWith({ sortBy: 'durationMs', page: 1 });

    const sortOrderSelect = screen.getByLabelText('Direction') as HTMLSelectElement;
    fireEvent.change(sortOrderSelect, { target: { value: 'asc' } });
    expect(onChange).toHaveBeenCalledWith({ sortOrder: 'asc', page: 1 });
  });

  it('enables "Clear filters" when sortBy/sortOrder differ from the defaults', () => {
    render(
      <RequestLogFilters
        value={{ ...DEFAULT_REQUEST_LOG_FILTERS, sortBy: 'durationMs' }}
        dateRangeError={null}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeEnabled();
  });

  it('disables "Clear filters" when every filter, including sort, is at its default', () => {
    render(
      <RequestLogFilters
        value={DEFAULT_REQUEST_LOG_FILTERS}
        dateRangeError={null}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });
});
