import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AllowedIpTypeBadge } from '@/components/allowed-ips/allowed-ip-type-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';

interface AllowedIpsTablePermissions {
  canUpdate: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
}

interface AllowedIpsTableProps {
  rows: AllowedIp[];
  permissions: AllowedIpsTablePermissions;
  onView: (allowedIp: AllowedIp) => void;
  onEdit: (allowedIp: AllowedIp) => void;
  onToggleStatus: (allowedIp: AllowedIp) => void;
  onDelete: (allowedIp: AllowedIp) => void;
}

export function AllowedIpsTable({
  rows,
  permissions,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: AllowedIpsTableProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('allowedIps.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('allowedIps.table.address')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('allowedIps.table.type')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('allowedIps.table.client')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('allowedIps.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('allowedIps.table.createdAt')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('allowedIps.table.updatedAt')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('allowedIps.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface/60">
              <td className="max-w-56 px-4 py-2 font-mono text-xs font-medium text-foreground">
                {row.type === 'HOSTNAME' ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block truncate">{row.address}</span>
                    </TooltipTrigger>
                    <TooltipContent>{row.address}</TooltipContent>
                  </Tooltip>
                ) : (
                  row.address
                )}
              </td>
              <td className="px-4 py-2">
                <AllowedIpTypeBadge type={row.type} />
              </td>
              <td className="px-4 py-2">{row.client.name}</td>
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
                      aria-label={t('allowedIps.table.actions')}
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onView(row)}>
                      {t('allowedIps.actions.view')}
                    </DropdownMenuItem>

                    {permissions.canUpdate && (
                      <DropdownMenuItem onSelect={() => onEdit(row)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        {t('allowedIps.actions.edit')}
                      </DropdownMenuItem>
                    )}

                    {permissions.canChangeStatus && (
                      <DropdownMenuItem onSelect={() => onToggleStatus(row)}>
                        <Power className="size-4" aria-hidden="true" />
                        {t(
                          row.active
                            ? 'allowedIps.actions.deactivate'
                            : 'allowedIps.actions.activate',
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
