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

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * Overrides `destructive` when set. `'warning'` is for a sensitive-but-not-
   * destructive change (e.g. disabling a route's API Key requirement) —
   * amber, not the red `destructive` reserves for actual data loss.
   */
  variant?: 'default' | 'destructive' | 'warning';
  isLoading?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
}

/** Generic confirm/cancel dialog — Radix handles focus trap + focus-return on close. */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  variant,
  isLoading,
  errorMessage,
  onConfirm,
}: ConfirmationDialogProps) {
  const { t } = useTranslation();
  const resolvedVariant = variant ?? (destructive ? 'destructive' : 'default');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

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
            {cancelLabel ?? t('shared.confirm.cancel')}
          </Button>
          <Button type="button" variant={resolvedVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading
              ? t('shared.confirm.loading')
              : (confirmLabel ?? t('shared.confirm.confirm'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
