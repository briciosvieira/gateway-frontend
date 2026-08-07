import { useTranslation } from 'react-i18next';

interface AppLogoProps {
  collapsed?: boolean;
}

export function AppLogo({ collapsed = false }: AppLogoProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <img src="/favicon.svg" alt="" className="size-6 shrink-0" aria-hidden="true" />
      {!collapsed && (
        <span className="truncate text-sm font-semibold text-sidebar-foreground">
          {t('app.name')}
        </span>
      )}
    </div>
  );
}
