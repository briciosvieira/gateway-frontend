import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/shared/status-badge';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';

interface ClientResourceDrawerHeaderProps {
  /** e.g. "API Keys — duda N8N" */
  title: string;
  client: { name: string; code: string; active: boolean };
}

/** Shared header for the three per-client resource drawers (API Keys, Allowed IPs, Gateway Routes) — name, identifier, and the client's own status (display only, never changed from here). */
export function ClientResourceDrawerHeader({ title, client }: ClientResourceDrawerHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription className="sr-only">{title}</SheetDescription>

      <div className="space-y-1">
        <p className="text-sm font-medium text-sidebar-foreground">{client.name}</p>
        <p className="font-mono text-xs text-sidebar-muted">{client.code}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-sidebar-muted">
            {t('shared.clientResource.clientStatus')}:
          </span>
          <StatusBadge active={client.active} />
        </div>
      </div>
    </div>
  );
}
