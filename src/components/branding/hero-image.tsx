import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface HeroImageProps {
  className?: string;
}

export function HeroImage({ className }: HeroImageProps) {
  const { t } = useTranslation();

  return (
    <img
      src="/duda10.png"
      alt={t('home.heroAlt')}
      className={cn('h-auto w-full max-w-md object-contain', className)}
    />
  );
}
