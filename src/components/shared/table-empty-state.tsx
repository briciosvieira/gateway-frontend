import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface TableEmptyStateProps {
  message: string;
  description?: string;
  action?: ReactNode;
}

export function TableEmptyState({ message, description, action }: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Inbox className="size-8 text-muted" aria-hidden="true" />
      <p className="text-sm text-muted">{message}</p>
      {description && <p className="max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
