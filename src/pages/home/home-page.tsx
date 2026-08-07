import { Activity, ClipboardList, KeyRound, Network, Route, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { HeroImage } from '@/components/branding/hero-image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiStatusCard } from '@/features/api-status/api-status-card';

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

  return (
    <div className="mx-auto flex min-h-full max-w-375 flex-col gap-5 p-6">
      <section className="grid min-h-90 items-center gap-6 rounded-3xl bg-linear-to-br from-surface via-background to-surface-soft p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex justify-center lg:order-2">
          <HeroImage className="mx-auto max-h-82.5 w-full max-w-105" />
        </div>

        <div className="space-y-3 text-center lg:order-1 lg:text-left">
          <h1 className="text-4xl font-bold text-foreground">{t('home.title')}</h1>
          <p className="text-lg font-medium text-primary">{t('home.subtitle')}</p>
          <p className="text-base leading-relaxed text-muted">{t('home.description')}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {HOME_CARDS.map(({ key, icon: Icon }) => (
          <Card key={key} className="min-h-27 transition-colors hover:border-primary/40">
            <CardHeader className="flex-row items-center gap-2 space-y-0 p-4 pb-1">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>{t(`home.cards.${key}.title`)}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription>{t(`home.cards.${key}.description`)}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="max-w-sm">
        <ApiStatusCard />
      </section>
    </div>
  );
}
