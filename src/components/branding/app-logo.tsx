import { useBranding } from '@/features/branding/branding.hooks';

interface AppLogoProps {
  collapsed?: boolean;
}

/** Sidebar/MobileSidebar header identity — dynamic logo + applicationName, falling back to the default asset/name via `useBranding`. */
export function AppLogo({ collapsed = false }: AppLogoProps) {
  const { branding } = useBranding();

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <img src={branding.logoUrl} alt="" className="size-6 shrink-0" aria-hidden="true" />
      {!collapsed && (
        <span className="truncate text-sm font-semibold text-sidebar-foreground">
          {branding.applicationName}
        </span>
      )}
    </div>
  );
}
