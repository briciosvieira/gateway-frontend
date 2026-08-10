import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ApiKeyRequirementBadge } from '@/components/gateway-routes/api-key-requirement-badge';
import { MethodBadge } from '@/components/gateway-routes/method-badge';
import { PublicEndpointField } from '@/components/gateway-routes/public-endpoint-field';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import { cn } from '@/lib/utils';

interface GatewayRoutesTablePermissions {
  canUpdate: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
}

interface GatewayRoutesTableProps {
  rows: GatewayRoute[];
  permissions: GatewayRoutesTablePermissions;
  onView: (route: GatewayRoute) => void;
  onEdit: (route: GatewayRoute) => void;
  onToggleStatus: (route: GatewayRoute) => void;
  onDelete: (route: GatewayRoute) => void;
}

export function GatewayRoutesTable({
  rows,
  permissions,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: GatewayRoutesTableProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('gatewayRoutes.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.name')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.client')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.method')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.slug')}
            </th>
            <th scope="col" className="min-w-56 px-4 py-2">
              {t('gatewayRoutes.table.publicEndpoint')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.timeout')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.retry')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('gatewayRoutes.table.createdAt')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('gatewayRoutes.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'hover:bg-surface/60',
                !row.requiresApiKey && 'border-l-2 border-l-amber-500',
              )}
            >
              <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
              <td className="px-4 py-2">{row.client.name}</td>
              <td className="px-4 py-2">
                <MethodBadge method={row.method} />
              </td>
              <td className="px-4 py-2 font-mono text-xs">{row.slug}</td>
              <td className="max-w-56 px-4 py-2">
                <PublicEndpointField publicPath={row.publicPath} truncate />
              </td>
              <td className="px-4 py-2">
                {t('gatewayRoutes.table.timeoutValue', { ms: row.timeoutMs })}
              </td>
              <td className="px-4 py-2">{row.retryCount}</td>
              <td className="px-4 py-2">
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge active={row.active} />
                  {!row.requiresApiKey && <ApiKeyRequirementBadge />}
                </div>
              </td>
              <td className="px-4 py-2">{dateFormatter.format(new Date(row.createdAt))}</td>
              <td className="px-4 py-2 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('gatewayRoutes.table.actions')}
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onView(row)}>
                      {t('gatewayRoutes.actions.view')}
                    </DropdownMenuItem>

                    {permissions.canUpdate && (
                      <DropdownMenuItem onSelect={() => onEdit(row)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        {t('gatewayRoutes.actions.edit')}
                      </DropdownMenuItem>
                    )}

                    {permissions.canChangeStatus && (
                      <DropdownMenuItem onSelect={() => onToggleStatus(row)}>
                        <Power className="size-4" aria-hidden="true" />
                        {t(
                          row.active
                            ? 'gatewayRoutes.actions.deactivate'
                            : 'gatewayRoutes.actions.activate',
                        )}
                      </DropdownMenuItem>
                    )}

                    {permissions.canDelete && (
                      <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(row)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t('common.actions.delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
