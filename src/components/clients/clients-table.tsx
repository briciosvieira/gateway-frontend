import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Client } from '@/features/clients/clients.types';

interface ClientsTablePermissions {
  canUpdate: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
}

interface ClientsTableProps {
  rows: Client[];
  permissions: ClientsTablePermissions;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onToggleStatus: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientsTable({
  rows,
  permissions,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: ClientsTableProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('clients.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('clients.table.name')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('clients.table.code')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('clients.table.contact')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('clients.table.email')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('clients.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('clients.table.createdAt')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('clients.table.updatedAt')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('clients.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface/60">
              <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
              <td className="px-4 py-2 font-mono text-xs">{row.code}</td>
              <td className="px-4 py-2">{row.contactName ?? t('clients.notAvailable')}</td>
              <td className="px-4 py-2">{row.contactEmail ?? t('clients.notAvailable')}</td>
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
                      aria-label={t('clients.table.actions')}
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onView(row)}>
                      {t('clients.actions.view')}
                    </DropdownMenuItem>

                    {permissions.canUpdate && (
                      <DropdownMenuItem onSelect={() => onEdit(row)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        {t('clients.actions.edit')}
                      </DropdownMenuItem>
                    )}

                    {permissions.canChangeStatus && (
                      <DropdownMenuItem onSelect={() => onToggleStatus(row)}>
                        <Power className="size-4" aria-hidden="true" />
                        {t(row.active ? 'clients.actions.deactivate' : 'clients.actions.activate')}
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
