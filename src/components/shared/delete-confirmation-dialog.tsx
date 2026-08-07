import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. `t('users.delete.title')` — module-specific title such as "Excluir usuário". */
  title: string;
  /** Name shown to identify the record being deleted (user name, client name, API key name...). */
  entityName: string;
  /** Extra warning shown below the standard irreversibility notice, e.g. "may be blocked if dependencies exist". */
  dependencyWarning?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
}

/**
 * Delete-specific confirmation dialog — reuses the same Dialog primitives as
 * `ConfirmationDialog` but adds a fixed irreversibility notice and an
 * optional dependency-conflict warning slot, per module (Clients, Gateway
 * Routes, etc. can be blocked by the backend when dependent records exist).
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  entityName,
  dependencyWarning,
  isLoading,
  errorMessage,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('delete.description', { name: entityName })}</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-destructive">{t('delete.irreversible')}</p>

        {dependencyWarning && <p className="text-sm text-muted-foreground">{dependencyWarning}</p>}

        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('common.actions.deleting') : t('common.actions.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
