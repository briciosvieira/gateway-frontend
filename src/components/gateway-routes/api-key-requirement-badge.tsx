import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Shown only for `requiresApiKey === false` — a route that intentionally
 * skips X-API-Key validation. Orange/warning tone on purpose (never red —
 * this isn't an error — and never green/blue, which would read as "safe"
 * or neutral): the route still works, it just carries a security exception
 * worth noticing. Never rendered for `requiresApiKey === true` (the safe
 * default needs no badge) and never conflated with the Ativo/Inativo
 * `StatusBadge` — the two are independent, shown side by side.
 */
export function ApiKeyRequirementBadge() {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <TriangleAlert className="size-3" aria-hidden="true" />
          {t('gatewayRoutes.badges.noApiKey')}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t('gatewayRoutes.badges.noApiKeyTooltip')}</TooltipContent>
    </Tooltip>
  );
}
