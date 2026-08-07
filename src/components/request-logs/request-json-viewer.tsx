import { useTranslation } from 'react-i18next';

import { formatRequestLogJson } from '@/features/request-logs/request-log-sanitizer';

interface RequestJsonViewerProps {
  label: string;
  value: unknown;
}

export function RequestJsonViewer({ label, value }: RequestJsonViewerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-sidebar-muted">{label}</p>
      {value === null || value === undefined ? (
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
          {t('requestLogs.noData')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface p-3">
          <pre className="font-mono text-xs whitespace-pre-wrap break-words">
            {formatRequestLogJson(value)}
          </pre>
        </div>
      )}
    </div>
  );
}
