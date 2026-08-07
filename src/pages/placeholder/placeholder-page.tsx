import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlaceholderPageProps {
  titleKey: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ titleKey, icon: Icon }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <Icon className="size-10 text-primary" aria-hidden="true" />
      <h1 className="text-2xl font-semibold text-foreground">{t(titleKey)}</h1>
      <p className="max-w-md text-sm text-muted">{t('pages.placeholder')}</p>
    </div>
  );
}
