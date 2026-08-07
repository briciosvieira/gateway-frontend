import type { GatewayHttpMethod } from '@/features/gateway-routes/gateway-routes.types';
import { cn } from '@/lib/utils';

interface MethodBadgeProps {
  method: GatewayHttpMethod;
}

const METHOD_BADGE_CLASSNAME: Record<GatewayHttpMethod, string> = {
  GET: 'bg-primary/10 text-primary',
  POST: 'bg-accent text-accent-foreground',
  PUT: 'bg-secondary text-secondary-foreground',
  PATCH: 'bg-secondary text-secondary-foreground',
  DELETE: 'bg-destructive/10 text-destructive',
};

export function MethodBadge({ method }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium',
        METHOD_BADGE_CLASSNAME[method],
      )}
    >
      {method}
    </span>
  );
}
