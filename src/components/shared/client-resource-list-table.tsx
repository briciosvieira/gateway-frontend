import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { ClientRef } from '@/features/clients/clients.types';

interface ClientResourceListTableProps<T> {
  rows: T[];
  getClient: (row: T) => ClientRef;
  /** Whether the row counts as "active" for the main STATUS column — always derived from the resource aggregate (`active > 0`), never from `client.active`. */
  isActive: (row: T) => boolean;
  /** Optional compact counts rendered under the STATUS badge (e.g. "5 total · 3 active · 2 inactive"). Feature-specific wording is supplied by the caller. */
  renderCounts?: (row: T) => ReactNode;
  /** e.g. "Ver API Keys" / "Ver IPs" / "Ver rotas" — the explicit action, in addition to the row itself being clickable. */
  actionLabel: string;
  /** sr-only table caption, e.g. the feature's page title. */
  caption: string;
  onOpenClient: (client: ClientRef) => void;
}

/**
 * Shared main-view table for API Keys / Allowed IPs / Gateway Routes: one
 * row per client, sourced from each feature's `clients-summary` aggregate
 * endpoint (only clients with at least one resource ever appear — the
 * backend already filters this out). STATUS is always derived from the
 * resource aggregate via `isActive`, never from the client entity's own
 * `active` flag (that stays in the Drawer header as "Status do cliente").
 */
export function ClientResourceListTable<T>({
  rows,
  getClient,
  isActive,
  renderCounts,
  actionLabel,
  caption,
  onOpenClient,
}: ClientResourceListTableProps<T>) {
  const { t } = useTranslation();

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('shared.clientResource.client')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('shared.clientResource.identifier')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('shared.clientResource.status')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('shared.clientResource.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const client = getClient(row);
            return (
              <tr
                key={client.id}
                className="cursor-pointer hover:bg-surface/60"
                onClick={() => onOpenClient(client)}
              >
                <td className="px-4 py-2 font-medium text-foreground">{client.name}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{client.code}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge active={isActive(row)} />
                    {renderCounts && (
                      <span className="text-xs text-muted-foreground">{renderCounts(row)}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenClient(client);
                    }}
                  >
                    {actionLabel}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
