import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface DashboardTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

interface DashboardTableProps<T> {
  columns: DashboardTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  caption?: string;
}

export function DashboardTable<T>({ columns, rows, getRowKey, caption }: DashboardTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-surface text-left text-xs font-medium uppercase tracking-wide text-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('px-4 py-2', column.align === 'right' && 'text-right')}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-surface/60">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-4 py-2', column.align === 'right' && 'text-right')}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
