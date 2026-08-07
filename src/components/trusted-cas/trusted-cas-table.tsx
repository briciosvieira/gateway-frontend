import { MoreHorizontal, Power, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { CopyField } from '@/components/shared/copy-field';
import { StatusBadge } from '@/components/shared/status-badge';
import { CertificateTypeBadge } from '@/components/trusted-cas/certificate-type-badge';
import { CertificateValidityBadge } from '@/components/trusted-cas/certificate-validity-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TrustedCaListItem } from '@/features/trusted-cas/trusted-cas.types';
import { formatCertificateFingerprintPreview } from '@/features/trusted-cas/trusted-cas.utils';

interface TrustedCasTablePermissions {
  canChangeStatus: boolean;
  canDelete: boolean;
}

interface TrustedCasTableProps {
  rows: TrustedCaListItem[];
  permissions: TrustedCasTablePermissions;
  onToggleStatus: (trustedCa: TrustedCaListItem) => void;
  onDelete: (trustedCa: TrustedCaListItem) => void;
}

/** Subject/Issuer can be long DNs — truncate visually, keep the full value reachable via tooltip. */
function TruncatedCell({
  value,
  maxWidthClassName = 'max-w-56',
}: {
  value: string;
  maxWidthClassName?: string;
}): ReactNode {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`block min-w-0 truncate ${maxWidthClassName}`}>{value}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-all">{value}</TooltipContent>
    </Tooltip>
  );
}

export function TrustedCasTable({
  rows,
  permissions,
  onToggleStatus,
  onDelete,
}: TrustedCasTableProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('settings.certificates.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.name')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.type')}
            </th>
            <th scope="col" className="min-w-44 px-4 py-2">
              {t('settings.certificates.table.fingerprint')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.subject')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.issuer')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.validFrom')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.validTo')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('settings.certificates.table.createdAt')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('settings.certificates.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface/60">
              <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
              <td className="px-4 py-2">
                <CertificateTypeBadge isRoot={row.isRoot} />
              </td>
              <td className="px-4 py-2">
                <CopyField
                  value={row.fingerprintSha256}
                  displayValue={formatCertificateFingerprintPreview(row.fingerprintSha256)}
                  truncate
                />
              </td>
              <td className="px-4 py-2">
                <TruncatedCell value={row.subject} maxWidthClassName="max-w-52 xl:max-w-60" />
              </td>
              <td className="px-4 py-2">
                <TruncatedCell value={row.issuer} maxWidthClassName="max-w-52 xl:max-w-60" />
              </td>
              <td className="px-4 py-2">{dateFormatter.format(new Date(row.validFrom))}</td>
              <td className="px-4 py-2">
                <div className="flex flex-col gap-1">
                  <span>{dateFormatter.format(new Date(row.validTo))}</span>
                  <CertificateValidityBadge validTo={row.validTo} />
                </div>
              </td>
              <td className="px-4 py-2">
                <StatusBadge active={row.active} />
              </td>
              <td className="px-4 py-2">{dateFormatter.format(new Date(row.createdAt))}</td>
              <td className="px-4 py-2 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('settings.certificates.table.actions')}
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {permissions.canChangeStatus && (
                      <DropdownMenuItem onSelect={() => onToggleStatus(row)}>
                        <Power className="size-4" aria-hidden="true" />
                        {t(
                          row.active
                            ? 'settings.certificates.actions.deactivate'
                            : 'settings.certificates.actions.activate',
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
