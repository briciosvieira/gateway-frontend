import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MethodBadge } from '@/components/gateway-routes/method-badge';
import { HttpStatusBadge } from '@/components/request-logs/http-status-badge';
import { RequestOriginBadge } from '@/components/request-logs/request-origin-badge';
import { RequestResultBadge } from '@/components/request-logs/request-result-badge';
import { Button } from '@/components/ui/button';
import type {
  RequestLogListItem,
  RequestLogSortBy,
  SortOrder,
} from '@/features/request-logs/request-logs.types';
import {
  formatRequestLogDateTime,
  formatRequestLogDuration,
} from '@/features/request-logs/request-logs.utils';
import { cn } from '@/lib/utils';

interface RequestLogsTableProps {
  rows: RequestLogListItem[];
  /** Real backend sort field currently applied to the query. */
  sortBy: RequestLogSortBy;
  /** Direction currently applied to `sortBy`. */
  sortOrder: SortOrder;
  onToggleSort: () => void;
  onView: (requestLog: RequestLogListItem) => void;
}

export function RequestLogsTable({
  rows,
  sortBy,
  sortOrder,
  onToggleSort,
  onView,
}: RequestLogsTableProps) {
  const { t, i18n } = useTranslation();

  // The "Horário" column's sort indicator only reflects the query's real
  // direction when `attemptedAt` is actually the active sort field —
  // otherwise showing an arrow here would misrepresent what the backend is
  // sorting by (e.g. while sorted by Duração/Status HTTP/Criado em).
  const isAttemptedAtSort = sortBy === 'attemptedAt';

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('requestLogs.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th
              scope="col"
              className="px-4 py-2"
              aria-sort={
                isAttemptedAtSort ? (sortOrder === 'desc' ? 'descending' : 'ascending') : 'none'
              }
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground"
                onClick={onToggleSort}
              >
                {t('requestLogs.table.attemptedAt')}
                {isAttemptedAtSort &&
                  (sortOrder === 'desc' ? (
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  ))}
                <span className="sr-only">
                  {t(
                    isAttemptedAtSort && sortOrder === 'desc'
                      ? 'requestLogs.table.sortToggleToAscending'
                      : 'requestLogs.table.sortToggleToDescending',
                  )}
                </span>
              </button>
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.origin')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.sourceIp')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.client')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.method')}
            </th>
            <th scope="col" className="min-w-56 px-4 py-2">
              {t('requestLogs.table.route')}
            </th>
            <th scope="col" className="min-w-56 px-4 py-2">
              {t('requestLogs.table.destination')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.result')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.duration')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('requestLogs.table.attempts')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('requestLogs.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface/60">
              <td className="px-4 py-2">
                {formatRequestLogDateTime(row.attemptedAt, i18n.language)}
              </td>
              <td className="px-4 py-2">
                <div className="flex min-w-40 flex-col items-start gap-1">
                  {row.requestOrigin ? (
                    <RequestOriginBadge origin={row.requestOrigin} />
                  ) : (
                    <span className="text-muted-foreground">{t('requestLogs.notInformed')}</span>
                  )}
                  <span className="text-xs text-muted-foreground break-all">
                    {row.sourceHost ?? t('requestLogs.notAvailable')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2">{row.sourceIp}</td>
              <td className="px-4 py-2">
                {row.client ? (
                  <div className="flex min-w-44 flex-col gap-0.5">
                    <span className="font-medium text-foreground">{row.client.name}</span>
                    <span className="text-xs text-muted-foreground">{row.client.code}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">{t('requestLogs.notIdentified')}</span>
                )}
              </td>
              <td className="px-4 py-2">
                <MethodBadge method={row.method} />
              </td>
              <td className="px-4 py-2">
                <div className="flex min-w-52 flex-col gap-0.5">
                  <span className="font-medium text-foreground">
                    {row.gatewayRoute?.name ?? t('requestLogs.notIdentified')}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground break-all">
                    {row.publicPath}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex min-w-52 flex-col gap-0.5">
                  <span className="break-all">
                    {row.destinationHost ?? t('requestLogs.notCalled')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.destinationIp ?? t('requestLogs.notCalled')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex min-w-24 flex-col items-start gap-1">
                  <HttpStatusBadge statusCode={row.statusCode} />
                  {row.errorCode && (
                    <span className="text-xs text-muted-foreground break-all">{row.errorCode}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2">
                <RequestResultBadge result={row.result} />
              </td>
              <td className="px-4 py-2">
                {formatRequestLogDuration(row.durationMs, i18n.language)}
              </td>
              <td className="px-4 py-2">
                <span
                  className={cn(
                    'inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
                    row.attempts > 1
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {row.attempts}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                <Button type="button" variant="outline" size="sm" onClick={() => onView(row)}>
                  {t('requestLogs.actions.view')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
