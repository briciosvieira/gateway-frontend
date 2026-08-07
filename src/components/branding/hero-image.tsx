import { useTranslation } from 'react-i18next';

import { useBranding } from '@/features/branding/branding.hooks';
import { cn } from '@/lib/utils';

interface HeroImageProps {
  className?: string;
}

/** Shared brand image for Home and Login — the same customized asset (or the default mascot) in both places, per product requirement. */
export function HeroImage({ className }: HeroImageProps) {
  const { t } = useTranslation();
  const { branding } = useBranding();

  return (
    <img
      src={branding.brandImageUrl}
      alt={t('home.heroAlt', { name: branding.applicationName })}
      className={cn('h-auto w-full max-w-md object-contain', className)}
    />
  );
}
