import { KeyRound, MoreHorizontal, Pencil, Power, ShieldOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ApiKey } from '@/features/api-keys/api-keys.types';
import { cn } from '@/lib/utils';

interface ApiKeysTablePermissions {
  canUpdate: boolean;
  canChangeStatus: boolean;
  canRevoke: boolean;
  canRegenerate: boolean;
  canDelete: boolean;
}

interface ApiKeysTableProps {
  rows: ApiKey[];
  permissions: ApiKeysTablePermissions;
  onView: (apiKey: ApiKey) => void;
  onEdit: (apiKey: ApiKey) => void;
  onToggleStatus: (apiKey: ApiKey) => void;
  onRevoke: (apiKey: ApiKey) => void;
  onRegenerate: (apiKey: ApiKey) => void;
  onDelete: (apiKey: ApiKey) => void;
}

export function ApiKeysTable({
  rows,
  permissions,
  onView,
  onEdit,
  onToggleStatus,
  onRevoke,
  onRegenerate,
  onDelete,
}: ApiKeysTableProps) {
  const { t, i18n } = useTranslation();
  // Captured once on mount, not re-read on every render — avoids calling the
  // impure `Date.now()` directly from the render body.
  const [now] = useState(() => Date.now());

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  function formatDate(value: string | null) {
    return value ? dateFormatter.format(new Date(value)) : t('apiKeys.notAvailable');
  }

  function isExpired(value: string | null) {
    return value !== null && new Date(value).getTime() < now;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('apiKeys.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('apiKeys.table.name')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('apiKeys.table.client')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('apiKeys.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('apiKeys.table.expiresAt')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('apiKeys.table.revoked')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('apiKeys.table.createdAt')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('apiKeys.table.lastUsedAt')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('apiKeys.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const revoked = row.revokedAt !== null;
            const expired = isExpired(row.expiresAt);

            return (
              <tr key={row.id} className="hover:bg-surface/60">
                <td className="px-4 py-2 font-medium text-foreground">
                  <div>{row.name}</div>
                  <div className="font-mono text-xs text-muted">{row.prefix}</div>
                </td>
                <td className="px-4 py-2">{row.client.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge active={row.active} />
                </td>
                <td className="px-4 py-2">
                  <span className={cn(expired && 'text-destructive')}>
                    {formatDate(row.expiresAt)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      revoked ? 'text-destructive' : 'text-muted',
                    )}
                  >
                    {t(revoked ? 'apiKeys.table.yes' : 'apiKeys.table.no')}
                  </span>
                </td>
                <td className="px-4 py-2">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-2">{formatDate(row.lastUsedAt)}</td>
                <td className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('apiKeys.table.actions')}
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onView(row)}>
                        {t('apiKeys.actions.view')}
                      </DropdownMenuItem>

                      {permissions.canUpdate && (
                        <DropdownMenuItem onSelect={() => onEdit(row)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          {t('apiKeys.actions.edit')}
                        </DropdownMenuItem>
                      )}

                      {permissions.canChangeStatus && !revoked && (
                        <DropdownMenuItem onSelect={() => onToggleStatus(row)}>
                          <Power className="size-4" aria-hidden="true" />
                          {t(
                            row.active ? 'apiKeys.actions.deactivate' : 'apiKeys.actions.activate',
                          )}
                        </DropdownMenuItem>
                      )}

                      {permissions.canRegenerate && (
                        <DropdownMenuItem onSelect={() => onRegenerate(row)}>
                          <KeyRound className="size-4" aria-hidden="true" />
                          {t('apiKeys.actions.regenerate')}
                        </DropdownMenuItem>
                      )}

                      {permissions.canRevoke && !revoked && (
                        <DropdownMenuItem onSelect={() => onRevoke(row)}>
                          <ShieldOff className="size-4" aria-hidden="true" />
                          {t('apiKeys.actions.revoke')}
                        </DropdownMenuItem>
                      )}

                      {permissions.canDelete && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => onDelete(row)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          {t('common.actions.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
