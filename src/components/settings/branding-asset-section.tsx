import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex).toLowerCase();
}

interface BrandingAssetSectionProps {
  title: string;
  previewUrl: string;
  previewAlt: string;
  isCustom: boolean;
  /** Comma-separated extensions, e.g. `.png,.jpg,.jpeg,.webp,.svg` — drives both the file picker `accept` and the client-side format check. */
  accept: string;
  /** Mirrors the real backend per-asset limit — rejects an oversized file instantly instead of always round-tripping into a 413. */
  maxSizeBytes: number;
  formatsHint: string;
  /** `compact` for logo/favicon (small square preview), `large` for the brand image (wider, still bounded). */
  variant: 'compact' | 'large';
  /** Gates the upload input (name update / new asset) — `branding.update`, ADMIN+OPERATOR. */
  canEdit: boolean;
  /** Gates the "reset to default" button and its confirm dialog — `branding.delete`, ADMIN only. Independent from `canEdit`: an operator can replace an asset but not remove it back to default. */
  canRemove: boolean;
  onUpload: (file: File) => void;
  onRemove: () => Promise<void>;
  isUploading: boolean;
  isRemoving: boolean;
  uploadErrorMessage?: string | null;
  removeErrorMessage?: string | null;
  removeConfirmTitle: string;
  removeConfirmDescription: string;
}

/**
 * Shared preview + upload + remove UI reused by the Logo/Favicon/Imagem
 * principal sections of the Personalização page — the only thing that
 * differs between the three is labels, accepted formats and which
 * upload/delete hook is wired in by the caller.
 */
export function BrandingAssetSection({
  title,
  previewUrl,
  previewAlt,
  isCustom,
  accept,
  maxSizeBytes,
  formatsHint,
  variant,
  canEdit,
  canRemove,
  onUpload,
  onRemove,
  isUploading,
  isRemoving,
  uploadErrorMessage,
  removeErrorMessage,
  removeConfirmTitle,
  removeConfirmDescription,
}: BrandingAssetSectionProps) {
  const { t } = useTranslation();
  // Bumped after a selection to force-remount the uncontrolled file input —
  // the standard way to clear a native `<input type="file">` in React.
  const [fileInputKey, setFileInputKey] = useState(0);
  const [localError, setLocalError] = useState<'format' | 'size' | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const acceptedExtensions = accept.split(',').map((extension) => extension.trim());

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileInputKey((key) => key + 1);
    if (!file) return;

    if (!acceptedExtensions.includes(getFileExtension(file.name))) {
      setLocalError('format');
      return;
    }

    if (file.size > maxSizeBytes) {
      setLocalError('size');
      return;
    }

    setLocalError(null);
    onUpload(file);
  }

  async function handleConfirmRemove() {
    try {
      await onRemove();
      setShowRemoveConfirm(false);
    } catch {
      // Surfaced via `removeErrorMessage` below — nothing else to do here.
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface',
            variant === 'compact' ? 'size-16 p-2' : 'h-32 w-full max-w-64 p-3',
          )}
        >
          <img
            src={previewUrl}
            alt={isCustom ? previewAlt : t('settings.personalization.noCustomImage')}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted">
            {isCustom ? formatsHint : t('settings.personalization.usingDefault')}
          </p>

          {(canEdit || canRemove) && (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <Input
                  key={fileInputKey}
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  disabled={isUploading || isRemoving}
                  aria-label={t('settings.personalization.actions.replace')}
                  className="max-w-64 file:mr-3 file:h-7 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium file:text-secondary-foreground"
                />
              )}

              {isCustom && canRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={isUploading || isRemoving}
                >
                  {t('settings.personalization.actions.resetToDefault')}
                </Button>
              )}
            </div>
          )}

          {localError === 'format' && (
            <p className="text-sm text-destructive">
              {t('settings.personalization.errors.unsupportedFormat')}
            </p>
          )}
          {localError === 'size' && (
            <p className="text-sm text-destructive">
              {t('settings.personalization.errors.fileTooLarge')}
            </p>
          )}
          {uploadErrorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {uploadErrorMessage}
            </p>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        title={removeConfirmTitle}
        description={removeConfirmDescription}
        confirmLabel={t('settings.personalization.actions.remove')}
        destructive
        isLoading={isRemoving}
        errorMessage={removeErrorMessage ?? null}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
