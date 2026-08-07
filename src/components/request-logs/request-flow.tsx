import { useTranslation } from 'react-i18next';

import { HttpStatusBadge } from '@/components/request-logs/http-status-badge';
import { RequestOriginBadge } from '@/components/request-logs/request-origin-badge';
import type { RequestLog } from '@/features/request-logs/request-logs.types';

interface RequestFlowProps {
  requestLog: RequestLog;
}

interface FlowStep {
  label: string;
  value: string;
  caption?: string;
}

function FlowItem({ label, value, caption, isLast }: FlowStep & { isLast: boolean }) {
  return (
    <div className="relative pl-6">
      {!isLast && (
        <div className="absolute top-4 left-[7px] h-[calc(100%-0.25rem)] w-px bg-border" />
      )}
      <span className="absolute top-1.5 left-0 h-4 w-4 rounded-full border border-border bg-background" />
      <p className="text-xs font-medium text-sidebar-muted">{label}</p>
      <p className="text-sm font-medium break-all">{value}</p>
      {caption && <p className="text-xs text-muted-foreground break-all">{caption}</p>}
    </div>
  );
}

export function RequestFlow({ requestLog }: RequestFlowProps) {
  const { t } = useTranslation();

  const steps: FlowStep[] = [
    {
      label: t('requestLogs.flow.sourceIp'),
      value: requestLog.sourceIp,
      caption: requestLog.requestOrigin
        ? t(`requestLogs.origins.${requestLog.requestOrigin}`)
        : t('requestLogs.notAvailable'),
    },
    {
      label: t('requestLogs.flow.sourceHost'),
      value: requestLog.sourceHost ?? t('requestLogs.notAvailable'),
    },
    {
      label: t('requestLogs.flow.publicEndpoint'),
      value: requestLog.publicEndpoint ?? requestLog.publicPath,
    },
    {
      label: t('requestLogs.flow.gatewayRoute'),
      value: requestLog.gatewayRoute?.name ?? t('requestLogs.notIdentified'),
      caption: requestLog.gatewayRoute?.slug ?? requestLog.publicPath,
    },
    {
      label: t('requestLogs.flow.destinationHost'),
      value: requestLog.destinationHost ?? t('requestLogs.notCalled'),
      caption: requestLog.destinationUrl ?? undefined,
    },
    {
      label: t('requestLogs.flow.destinationIp'),
      value: requestLog.destinationIp ?? t('requestLogs.notCalled'),
    },
  ];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{t('requestLogs.flow.title')}</h3>
        {requestLog.requestOrigin && <RequestOriginBadge origin={requestLog.requestOrigin} />}
        <HttpStatusBadge statusCode={requestLog.statusCode} />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <FlowItem key={step.label} {...step} isLast={index === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}
