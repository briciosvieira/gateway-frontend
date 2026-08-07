import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MethodBadge } from '@/components/gateway-routes/method-badge';
import { SensitiveBadge } from '@/components/route-headers/sensitive-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  RouteHeaderGatewayRouteOption,
  RouteHeaderListItem,
} from '@/features/route-headers/route-headers.types';

interface RouteHeadersTablePermissions {
  canUpdate: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
}

interface RouteHeadersTableProps {
  rows: RouteHeaderListItem[];
  routeContexts: Record<string, RouteHeaderGatewayRouteOption>;
  permissions: RouteHeadersTablePermissions;
  onView: (routeHeader: RouteHeaderListItem) => void;
  onEdit: (routeHeader: RouteHeaderListItem) => void;
  onToggleStatus: (routeHeader: RouteHeaderListItem) => void;
  onDelete: (routeHeader: RouteHeaderListItem) => void;
}

export function RouteHeadersTable({
  rows,
  routeContexts,
  permissions,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: RouteHeadersTableProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('routeHeaders.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('routeHeaders.table.name')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('routeHeaders.table.gatewayRoute')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('routeHeaders.table.client')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('routeHeaders.table.sensitive')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('routeHeaders.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('routeHeaders.table.createdAt')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('routeHeaders.table.updatedAt')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('routeHeaders.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const routeContext = routeContexts[row.gatewayRouteId];

            return (
              <tr key={row.id} className="hover:bg-surface/60">
                <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-2">
                  <div className="flex min-w-52 flex-col gap-1">
                    <span>{routeContext?.name ?? t('routeHeaders.notAvailable')}</span>
                    {routeContext && <MethodBadge method={routeContext.method} />}
                  </div>
                </td>
                <td className="px-4 py-2">
                  {routeContext?.client.name ?? t('routeHeaders.notAvailable')}
                </td>
                <td className="px-4 py-2">
                  <SensitiveBadge sensitive={row.sensitive} />
                </td>
                <td className="px-4 py-2">
                  <StatusBadge active={row.active} />
                </td>
                <td className="px-4 py-2">{dateFormatter.format(new Date(row.createdAt))}</td>
                <td className="px-4 py-2">{dateFormatter.format(new Date(row.updatedAt))}</td>
                <td className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('routeHeaders.table.actions')}
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onView(row)}>
                        {t('routeHeaders.actions.view')}
                      </DropdownMenuItem>

                      {permissions.canUpdate && (
                        <DropdownMenuItem onSelect={() => onEdit(row)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          {t('routeHeaders.actions.edit')}
                        </DropdownMenuItem>
                      )}

                      {permissions.canChangeStatus && (
                        <DropdownMenuItem onSelect={() => onToggleStatus(row)}>
                          <Power className="size-4" aria-hidden="true" />
                          {t(
                            row.active
                              ? 'routeHeaders.actions.deactivate'
                              : 'routeHeaders.actions.activate',
                          )}
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
