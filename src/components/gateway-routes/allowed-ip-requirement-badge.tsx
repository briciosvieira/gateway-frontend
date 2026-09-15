import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Shown only for `requiresAllowedIp === false` — a route that intentionally
 * skips Allowed IP validation. Mirrors `ApiKeyRequirementBadge` exactly:
 * orange/warning tone on purpose (never red — this isn't an error — and
 * never green/blue, which would read as "safe" or neutral). Never rendered
 * for `requiresAllowedIp === true` (the safe default needs no badge) and
 * shown independently from `ApiKeyRequirementBadge` — the two flags are
 * unrelated and a route can carry either, both, or neither badge.
 */
export function AllowedIpRequirementBadge() {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <TriangleAlert className="size-3" aria-hidden="true" />
          {t('gatewayRoutes.badges.noAllowedIp')}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t('gatewayRoutes.badges.noAllowedIpTooltip')}</TooltipContent>
    </Tooltip>
  );
}
