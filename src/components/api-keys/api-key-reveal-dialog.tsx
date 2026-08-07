import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CopyField } from '@/components/shared/copy-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { env } from '@/config/env';

interface ApiKeyRevealDialogProps {
  open: boolean;
  apiKey: string;
  onClose: () => void;
}

const GATEWAY_PUBLIC_PREFIX = '/gateway';

/**
 * Shown once, right after create/regenerate succeeds. The plaintext key is
 * never logged, never persisted (no localStorage/sessionStorage/Context/
 * Redux) — it only lives in the parent page's local state, cleared by the
 * caller's `onClose`. An API Key is client-scoped (confirmed against the
 * backend: no route relation on the `ApiKey` model), so there is no single
 * fixed "public endpoint" per key — this shows the gateway's public base
 * URL only, not a fabricated per-key path.
 */
export function ApiKeyRevealDialog({ open, apiKey, onClose }: ApiKeyRevealDialogProps) {
  const { t } = useTranslation();

  const publicGatewayUrl = env.VITE_PUBLIC_GATEWAY_URL
    ? `${env.VITE_PUBLIC_GATEWAY_URL}${GATEWAY_PUBLIC_PREFIX}`
    : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showClose={false}>
        <DialogHeader>
          <DialogTitle>{t('apiKeys.reveal.title')}</DialogTitle>
          <DialogDescription>{t('apiKeys.reveal.description')}</DialogDescription>
        </DialogHeader>

        <CopyField value={apiKey} label={t('apiKeys.reveal.keyLabel')} />

        <p className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t('apiKeys.reveal.warning')}
        </p>

        {publicGatewayUrl ? (
          <div className="space-y-1">
            <CopyField value={publicGatewayUrl} label={t('apiKeys.reveal.endpointLabel')} />
            <p className="text-xs text-muted">{t('apiKeys.reveal.endpointNote')}</p>
          </div>
        ) : (
          <p className="text-xs text-muted">{t('apiKeys.reveal.endpointUnavailable')}</p>
        )}

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t('apiKeys.reveal.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
