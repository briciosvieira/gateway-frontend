import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsibleFilterPanelProps {
  searchSlot: ReactNode;
  gridClassName: string;
  hasActiveFilters: boolean;
  children: ReactNode;
  /** Starts expanded instead of collapsed — e.g. when a validation error inside the panel must be visible on mount. */
  defaultExpanded?: boolean;
}

/**
 * Search stays visible at all times; every other filter field is hidden
 * behind a "Filters" toggle and only rendered once expanded — collapsed is
 * the default on mount, matching the other filter bars this wraps.
 */
export function CollapsibleFilterPanel({
  searchSlot,
  gridClassName,
  hasActiveFilters,
  children,
  defaultExpanded = false,
}: CollapsibleFilterPanelProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">{searchSlot}</div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          className="shrink-0 gap-2"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t('shared.filters.toggle')}
          {hasActiveFilters && (
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          )}
          <ChevronDown
            className={cn('size-4 transition-transform', isExpanded && 'rotate-180')}
            aria-hidden="true"
          />
        </Button>
      </div>

      {isExpanded && <div className={cn('mt-3 grid gap-3', gridClassName)}>{children}</div>}
    </div>
  );
}
