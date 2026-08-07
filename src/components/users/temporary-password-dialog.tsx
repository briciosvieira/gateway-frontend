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

interface TemporaryPasswordDialogProps {
  open: boolean;
  password: string;
  mustChangeOnNextLogin: boolean;
  onClose: () => void;
}

/**
 * Shown once, right after create/reset-password succeeds. The password is
 * never logged, never persisted (no localStorage, no global state) — it
 * only lives in the parent page's local state, which the caller clears in
 * `onClose`.
 */
export function TemporaryPasswordDialog({
  open,
  password,
  mustChangeOnNextLogin,
  onClose,
}: TemporaryPasswordDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showClose={false}>
        <DialogHeader>
          <DialogTitle>{t('users.temporaryPassword.title')}</DialogTitle>
          <DialogDescription>{t('users.temporaryPassword.description')}</DialogDescription>
        </DialogHeader>

        <CopyField value={password} label={t('users.temporaryPassword.label')} />

        <p className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t('users.temporaryPassword.warning')}
        </p>

        <p className="text-sm text-muted">
          {t(
            mustChangeOnNextLogin
              ? 'users.temporaryPassword.mustChange'
              : 'users.temporaryPassword.mayKeep',
          )}
        </p>

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t('users.temporaryPassword.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
