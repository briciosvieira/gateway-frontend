import { Activity, ClipboardList, KeyRound, Network, Route, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { HeroImage } from '@/components/branding/hero-image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiStatusInline } from '@/features/api-status/api-status-inline';
import { useBranding } from '@/features/branding/branding.hooks';

const HOME_CARDS = [
  { key: 'security', icon: Shield },
  { key: 'apiKeys', icon: KeyRound },
  { key: 'ipControl', icon: Network },
  { key: 'routes', icon: Route },
  { key: 'audit', icon: ClipboardList },
  { key: 'monitoring', icon: Activity },
] as const;

export function HomePage() {
  const { t } = useTranslation();
  const { branding } = useBranding();

  return (
    <div className="mx-auto flex min-h-full max-w-375 flex-col gap-3 p-5">
      <section className="grid min-h-60 items-center gap-4 rounded-3xl bg-linear-to-br from-surface via-background to-surface-soft p-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex justify-center lg:order-2">
          <HeroImage className="mx-auto max-h-52 w-full max-w-76" />
        </div>

        <div className="space-y-2 text-center lg:order-1 lg:text-left">
          <h1 className="text-3xl font-bold text-foreground">{branding.applicationName}</h1>
          <p className="text-base font-medium text-primary">{t('home.subtitle')}</p>
          <p className="text-sm leading-relaxed text-muted">
            {t('home.description', { name: branding.applicationName })}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {HOME_CARDS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex flex-col gap-1.5">
            {/* Fixed height keeps all 6 cards visually uniform regardless of
                whether the translated description wraps to one or two lines
                — the Monitoring card stays this same height too, since the
                backend status line lives outside it, below, in this same
                wrapper. */}
            <Card className="flex h-28 flex-col transition-colors hover:border-primary/40">
              <CardHeader className="flex-row items-center gap-2 space-y-0 p-3 pb-1">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <CardTitle>{t(`home.cards.${key}.title`)}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-3 pt-0">
                <CardDescription>{t(`home.cards.${key}.description`)}</CardDescription>
              </CardContent>
            </Card>
            {key === 'monitoring' && <ApiStatusInline className="px-1" />}
          </div>
        ))}
      </section>
    </div>
  );
}
