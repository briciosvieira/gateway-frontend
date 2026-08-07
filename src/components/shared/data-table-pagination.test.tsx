import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DataTablePagination } from '@/components/shared/data-table-pagination';
import i18next from '@/lib/i18n';

describe('DataTablePagination', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('disables "Previous" on the first page', () => {
    render(<DataTablePagination page={1} pageSize={10} total={25} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/ })).not.toBeDisabled();
  });

  it('disables "Next" on the last page', () => {
    render(<DataTablePagination page={3} pageSize={10} total={25} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Previous/ })).not.toBeDisabled();
  });

  it('calls onPageChange with the next/previous page', () => {
    const onPageChange = vi.fn();
    render(<DataTablePagination page={2} pageSize={10} total={25} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
