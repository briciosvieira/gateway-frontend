import { useTranslation } from 'react-i18next';

import { AuditActionBadge } from '@/components/audit-logs/audit-action-badge';
import { AuditEntityBadge } from '@/components/audit-logs/audit-entity-badge';
import { Button } from '@/components/ui/button';
import type { AuditLogListItem } from '@/features/audit-logs/audit-logs.types';

interface AuditLogsTableProps {
  rows: AuditLogListItem[];
  onView: (auditLog: AuditLogListItem) => void;
}

export function AuditLogsTable({ rows, onView }: AuditLogsTableProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('auditLogs.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('auditLogs.table.date')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('auditLogs.table.user')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('auditLogs.table.action')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('auditLogs.table.entity')}
            </th>
            <th scope="col" className="min-w-72 px-4 py-2">
              {t('auditLogs.table.description')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('auditLogs.table.sourceIp')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('auditLogs.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface/60">
              <td className="px-4 py-2">{dateFormatter.format(new Date(row.createdAt))}</td>
              <td className="px-4 py-2">
                {row.user ? (
                  <div className="flex min-w-44 flex-col gap-0.5">
                    <span className="font-medium text-foreground">{row.user.name}</span>
                    <span className="text-xs text-muted-foreground">{row.user.username}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">{t('auditLogs.removedUser')}</span>
                )}
              </td>
              <td className="px-4 py-2">
                <AuditActionBadge action={row.action} />
              </td>
              <td className="px-4 py-2">
                <AuditEntityBadge entity={row.entity} />
              </td>
              <td className="max-w-72 px-4 py-2">
                <p className="truncate" title={row.description ?? undefined}>
                  {row.description ?? t('auditLogs.notAvailable')}
                </p>
              </td>
              <td className="px-4 py-2">{row.sourceIp ?? t('auditLogs.notAvailable')}</td>
              <td className="px-4 py-2 text-right">
                <Button type="button" variant="outline" size="sm" onClick={() => onView(row)}>
                  {t('auditLogs.actions.view')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
