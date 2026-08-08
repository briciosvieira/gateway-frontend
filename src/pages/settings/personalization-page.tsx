import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandingAssetSection } from '@/components/settings/branding-asset-section';
import { BrandingNameForm } from '@/components/settings/branding-name-form';
import { useAuth } from '@/features/auth/use-auth';
import { getBrandingUploadErrorMessage } from '@/features/branding/branding-errors';
import {
  BRANDING_BRAND_IMAGE_ACCEPT,
  BRANDING_BRAND_IMAGE_MAX_SIZE_BYTES,
  BRANDING_FAVICON_ACCEPT,
  BRANDING_FAVICON_MAX_SIZE_BYTES,
  BRANDING_LOGO_ACCEPT,
  BRANDING_LOGO_MAX_SIZE_BYTES,
} from '@/features/branding/branding.constants';
import {
  useBranding,
  useDeleteBrandingFavicon,
  useDeleteBrandingImage,
  useDeleteBrandingLogo,
  useUpdateBrandingName,
  useUploadBrandingFavicon,
  useUploadBrandingImage,
  useUploadBrandingLogo,
} from '@/features/branding/branding.hooks';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

/**
 * Global, installation-wide branding — never per-user/per-client. Reachable
 * by ADMIN + OPERATOR (unlike Certificados, which stays ADMIN-only). Within
 * the page, write actions split in two: `branding.update` (name, upload —
 * ADMIN+OPERATOR) and `branding.delete` (reset-to-default — ADMIN only),
 * mirroring the backend's per-method `@Roles` on `BrandingAdminController`.
 * `GET /branding` itself (via `useBranding`) is a public endpoint reused
 * unchanged from Sidebar/Home/Login — this page only adds mutations.
 */
export function PersonalizationPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('branding.update');
  const canRemove = hasPermission('branding.delete');

  const { branding } = useBranding();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const updateNameMutation = useUpdateBrandingName();
  const uploadLogoMutation = useUploadBrandingLogo();
  const uploadFaviconMutation = useUploadBrandingFavicon();
  const uploadImageMutation = useUploadBrandingImage();
  const deleteLogoMutation = useDeleteBrandingLogo();
  const deleteFaviconMutation = useDeleteBrandingFavicon();
  const deleteImageMutation = useDeleteBrandingImage();

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function handleSubmitName(applicationName: string) {
    updateNameMutation.mutate(
      { applicationName },
      {
        onSuccess: () => showFeedback('success', t('settings.personalization.success.nameSaved')),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t('settings.personalization.title')}
        </h2>
        <p className="text-sm font-medium text-foreground/75">
          {t('settings.personalization.subtitle')}
        </p>
        <p className="max-w-3xl min-w-0 text-sm leading-6 text-muted break-words">
          {t('settings.personalization.description')}
        </p>
      </div>

      {feedback && (
        <p
          role="status"
          className={
            feedback.type === 'success'
              ? 'rounded-md bg-primary/10 px-4 py-2 text-sm text-primary'
              : 'rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive'
          }
        >
          {feedback.message}
        </p>
      )}

      <BrandingNameForm
        applicationName={branding.applicationName}
        canEdit={canEdit}
        isSubmitting={updateNameMutation.isPending}
        error={updateNameMutation.error}
        onSubmit={handleSubmitName}
      />

      <BrandingAssetSection
        title={t('settings.personalization.logo.title')}
        previewUrl={branding.logoUrl}
        previewAlt={t('settings.personalization.logo.title')}
        isCustom={branding.isCustomLogo}
        accept={BRANDING_LOGO_ACCEPT}
        maxSizeBytes={BRANDING_LOGO_MAX_SIZE_BYTES}
        formatsHint={t('settings.personalization.logo.formats')}
        variant="compact"
        canEdit={canEdit}
        canRemove={canRemove}
        onUpload={(file) =>
          uploadLogoMutation.mutate(file, {
            onSuccess: () =>
              showFeedback('success', t('settings.personalization.success.logoUpdated')),
          })
        }
        onRemove={async () => {
          await deleteLogoMutation.mutateAsync();
          showFeedback('success', t('settings.personalization.success.logoRemoved'));
        }}
        isUploading={uploadLogoMutation.isPending}
        isRemoving={deleteLogoMutation.isPending}
        uploadErrorMessage={
          uploadLogoMutation.isError
            ? getBrandingUploadErrorMessage(
                uploadLogoMutation.error,
                t('settings.personalization.errors.imageUpdateFailed'),
              )
            : null
        }
        removeErrorMessage={
          deleteLogoMutation.isError
            ? getBrandingUploadErrorMessage(
                deleteLogoMutation.error,
                t('settings.personalization.errors.imageUpdateFailed'),
              )
            : null
        }
        removeConfirmTitle={t('settings.personalization.logo.removeTitle')}
        removeConfirmDescription={t('settings.personalization.logo.removeDescription')}
      />

      <BrandingAssetSection
        title={t('settings.personalization.favicon.title')}
        previewUrl={branding.faviconUrl}
        previewAlt={t('settings.personalization.favicon.title')}
        isCustom={branding.isCustomFavicon}
        accept={BRANDING_FAVICON_ACCEPT}
        maxSizeBytes={BRANDING_FAVICON_MAX_SIZE_BYTES}
        formatsHint={t('settings.personalization.favicon.formats')}
        variant="compact"
        canEdit={canEdit}
        canRemove={canRemove}
        onUpload={(file) =>
          uploadFaviconMutation.mutate(file, {
            onSuccess: () =>
              showFeedback('success', t('settings.personalization.success.faviconUpdated')),
          })
        }
        onRemove={async () => {
          await deleteFaviconMutation.mutateAsync();
          showFeedback('success', t('settings.personalization.success.faviconRemoved'));
        }}
        isUploading={uploadFaviconMutation.isPending}
        isRemoving={deleteFaviconMutation.isPending}
        uploadErrorMessage={
          uploadFaviconMutation.isError
            ? getBrandingUploadErrorMessage(
                uploadFaviconMutation.error,
                t('settings.personalization.errors.imageUpdateFailed'),
              )
            : null
        }
        removeErrorMessage={
          deleteFaviconMutation.isError
            ? getBrandingUploadErrorMessage(
                deleteFaviconMutation.error,
                t('settings.personalization.errors.imageUpdateFailed'),
              )
            : null
        }
        removeConfirmTitle={t('settings.personalization.favicon.removeTitle')}
        removeConfirmDescription={t('settings.personalization.favicon.removeDescription')}
      />

      <BrandingAssetSection
        title={t('settings.personalization.brandImage.title')}
        previewUrl={branding.brandImageUrl}
        previewAlt={t('settings.personalization.brandImage.title')}
        isCustom={branding.isCustomBrandImage}
        accept={BRANDING_BRAND_IMAGE_ACCEPT}
        maxSizeBytes={BRANDING_BRAND_IMAGE_MAX_SIZE_BYTES}
        formatsHint={t('settings.personalization.brandImage.formats')}
        variant="large"
        canEdit={canEdit}
        canRemove={canRemove}
        onUpload={(file) =>
          uploadImageMutation.mutate(file, {
            onSuccess: () =>
              showFeedback('success', t('settings.personalization.success.imageUpdated')),
          })
        }
        onRemove={async () => {
          await deleteImageMutation.mutateAsync();
          showFeedback('success', t('settings.personalization.success.imageRemoved'));
        }}
        isUploading={uploadImageMutation.isPending}
        isRemoving={deleteImageMutation.isPending}
        uploadErrorMessage={
          uploadImageMutation.isError
            ? getBrandingUploadErrorMessage(
                uploadImageMutation.error,
                t('settings.personalization.errors.imageUpdateFailed'),
              )
            : null
        }
        removeErrorMessage={
          deleteImageMutation.isError
            ? getBrandingUploadErrorMessage(
                deleteImageMutation.error,
                t('settings.personalization.errors.imageUpdateFailed'),
              )
            : null
        }
        removeConfirmTitle={t('settings.personalization.brandImage.removeTitle')}
        removeConfirmDescription={t('settings.personalization.brandImage.removeDescription')}
      />
    </div>
  );
}
