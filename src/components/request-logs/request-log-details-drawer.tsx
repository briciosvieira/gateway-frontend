import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { MethodBadge } from '@/components/gateway-routes/method-badge';
import { HttpStatusBadge } from '@/components/request-logs/http-status-badge';
import { RequestFlow } from '@/components/request-logs/request-flow';
import { RequestJsonViewer } from '@/components/request-logs/request-json-viewer';
import { RequestOriginBadge } from '@/components/request-logs/request-origin-badge';
import { RequestResultBadge } from '@/components/request-logs/request-result-badge';
import { CopyField } from '@/components/shared/copy-field';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useRequestLog } from '@/features/request-logs/hooks/use-request-log';
import type { RequestLog, RequestLogListItem } from '@/features/request-logs/request-logs.types';
import {
  formatRequestLogBytes,
  formatRequestLogDateTime,
  formatRequestLogDuration,
} from '@/features/request-logs/request-logs.utils';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface RequestLogDetailsDrawerProps {
  open: boolean;
  requestLog: RequestLogListItem | null;
  onOpenChange: (open: boolean) => void;
}

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="space-y-3 border-b border-sidebar-border py-4 last:border-b-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-sidebar-muted">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function renderClient(requestLog: RequestLog | RequestLogListItem, notIdentifiedLabel: string) {
  if (!requestLog.client) {
    return notIdentifiedLabel;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{requestLog.client.name}</span>
      <span className="text-xs text-muted-foreground">{requestLog.client.code}</span>
      <span className="text-xs text-muted-foreground">{requestLog.client.id}</span>
    </div>
  );
}

function renderApiKey(requestLog: RequestLog | RequestLogListItem, notIdentifiedLabel: string) {
  if (!requestLog.apiKey) {
    return notIdentifiedLabel;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{requestLog.apiKey.name}</span>
      <span className="text-xs text-muted-foreground">{requestLog.apiKey.id}</span>
    </div>
  );
}

function renderGatewayRoute(
  requestLog: RequestLog | RequestLogListItem,
  notIdentifiedLabel: string,
) {
  if (!requestLog.gatewayRoute) {
    return notIdentifiedLabel;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{requestLog.gatewayRoute.name}</span>
      <span className="text-xs text-muted-foreground">{requestLog.gatewayRoute.slug}</span>
      <span className="text-xs text-muted-foreground">{requestLog.gatewayRoute.id}</span>
    </div>
  );
}

function isRequestLogDetail(requestLog: RequestLog | RequestLogListItem): requestLog is RequestLog {
  return (
    'destinationUrl' in requestLog &&
    'upstreamStatusCode' in requestLog &&
    'requestHeaders' in requestLog &&
    'responseBody' in requestLog
  );
}

export function RequestLogDetailsDrawer({
  open,
  requestLog,
  onOpenChange,
}: RequestLogDetailsDrawerProps) {
  const { t, i18n } = useTranslation();
  const requestLogQuery = useRequestLog(requestLog?.id, open);
  const currentRequestLog = requestLogQuery.data ?? requestLog;
  const requestLogDetail =
    currentRequestLog && isRequestLogDetail(currentRequestLog) ? currentRequestLog : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6 sm:max-w-2xl">
        <SheetTitle>{t('requestLogs.details.title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('requestLogs.details.title')}</SheetDescription>

        {requestLogQuery.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {getApiErrorMessage(requestLogQuery.error, t('requestLogs.error'))}
          </p>
        )}

        {currentRequestLog && (
          <div className="mt-2">
            <DetailSection title={t('requestLogs.sections.summary')}>
              <DetailRow label={t('requestLogs.details.attemptedAt')}>
                {formatRequestLogDateTime(currentRequestLog.attemptedAt, i18n.language)}
              </DetailRow>

              <DetailRow label={t('requestLogs.details.createdAt')}>
                {formatRequestLogDateTime(currentRequestLog.createdAt, i18n.language)}
              </DetailRow>

              <DetailRow label={t('requestLogs.table.result')}>
                <RequestResultBadge result={currentRequestLog.result} />
              </DetailRow>

              <DetailRow label={t('requestLogs.table.status')}>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t('requestLogs.details.gatewayStatus')}
                    </span>
                    <HttpStatusBadge statusCode={currentRequestLog.statusCode} />
                  </div>
                  {requestLogDetail && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {t('requestLogs.details.upstreamStatus')}
                      </span>
                      <HttpStatusBadge statusCode={requestLogDetail.upstreamStatusCode} />
                    </div>
                  )}
                </div>
              </DetailRow>

              <DetailRow label={t('requestLogs.table.duration')}>
                {formatRequestLogDuration(currentRequestLog.durationMs, i18n.language)}
              </DetailRow>

              <DetailRow label={t('requestLogs.table.attempts')}>
                {currentRequestLog.attempts}
              </DetailRow>

              <DetailRow label={t('requestLogs.details.requestId')}>
                <CopyField value={currentRequestLog.requestId} />
              </DetailRow>
            </DetailSection>

            {requestLogDetail && <RequestFlow requestLog={requestLogDetail} />}

            <DetailSection title={t('requestLogs.sections.origin')}>
              <DetailRow label={t('requestLogs.details.requestOrigin')}>
                {currentRequestLog.requestOrigin ? (
                  <RequestOriginBadge origin={currentRequestLog.requestOrigin} />
                ) : (
                  t('requestLogs.notAvailable')
                )}
              </DetailRow>

              <DetailRow label={t('requestLogs.details.sourceHost')}>
                {currentRequestLog.sourceHost ?? t('requestLogs.notAvailable')}
              </DetailRow>

              <DetailRow label={t('requestLogs.details.sourceIp')}>
                {currentRequestLog.sourceIp}
              </DetailRow>

              <DetailRow label={t('requestLogs.details.client')}>
                {renderClient(currentRequestLog, t('requestLogs.notIdentified'))}
              </DetailRow>

              <DetailRow label={t('requestLogs.details.apiKey')}>
                {renderApiKey(currentRequestLog, t('requestLogs.notIdentified'))}
              </DetailRow>
            </DetailSection>

            <DetailSection title={t('requestLogs.sections.routing')}>
              <DetailRow label={t('requestLogs.details.method')}>
                <MethodBadge method={currentRequestLog.method} />
              </DetailRow>

              <DetailRow label={t('requestLogs.details.requestPath')}>
                <code className="break-all">{currentRequestLog.publicPath}</code>
              </DetailRow>

              <DetailRow label={t('requestLogs.details.publicEndpoint')}>
                {currentRequestLog.publicEndpoint ? (
                  <CopyField value={currentRequestLog.publicEndpoint} />
                ) : (
                  t('requestLogs.notAvailable')
                )}
              </DetailRow>

              <DetailRow label={t('requestLogs.details.gatewayRoute')}>
                {renderGatewayRoute(currentRequestLog, t('requestLogs.notIdentified'))}
              </DetailRow>
            </DetailSection>

            {requestLogDetail && (
              <>
                <DetailSection title={t('requestLogs.sections.destination')}>
                  <DetailRow label={t('requestLogs.details.destinationHost')}>
                    {requestLogDetail.destinationHost ?? t('requestLogs.notCalled')}
                  </DetailRow>

                  <DetailRow label={t('requestLogs.details.destinationUrl')}>
                    {requestLogDetail.destinationUrl ? (
                      <CopyField value={requestLogDetail.destinationUrl} />
                    ) : (
                      t('requestLogs.notCalled')
                    )}
                  </DetailRow>

                  <DetailRow label={t('requestLogs.details.destinationIp')}>
                    {requestLogDetail.destinationIp ?? t('requestLogs.notCalled')}
                  </DetailRow>

                  <DetailRow label={t('requestLogs.details.upstreamStatus')}>
                    <HttpStatusBadge statusCode={requestLogDetail.upstreamStatusCode} />
                  </DetailRow>
                </DetailSection>

                {(requestLogDetail.errorCode || requestLogDetail.errorMessage) && (
                  <DetailSection title={t('requestLogs.sections.error')}>
                    <DetailRow label={t('requestLogs.details.errorCode')}>
                      {requestLogDetail.errorCode ?? t('requestLogs.notAvailable')}
                    </DetailRow>

                    <DetailRow label={t('requestLogs.details.errorMessage')}>
                      {requestLogDetail.errorMessage ?? t('requestLogs.notAvailable')}
                    </DetailRow>
                  </DetailSection>
                )}

                <DetailSection title={t('requestLogs.sections.payload')}>
                  <RequestJsonViewer
                    label={t('requestLogs.details.requestHeaders')}
                    value={requestLogDetail.requestHeaders}
                  />

                  <RequestJsonViewer
                    label={t('requestLogs.details.responseHeaders')}
                    value={requestLogDetail.responseHeaders}
                  />

                  <RequestJsonViewer
                    label={t('requestLogs.details.requestQuery')}
                    value={requestLogDetail.requestQuery}
                  />

                  <RequestJsonViewer
                    label={t('requestLogs.details.requestBody')}
                    value={requestLogDetail.requestBody}
                  />

                  <RequestJsonViewer
                    label={t('requestLogs.details.responseBody')}
                    value={requestLogDetail.responseBody}
                  />

                  <DetailRow label={t('requestLogs.details.requestSize')}>
                    {formatRequestLogBytes(requestLogDetail.requestSizeBytes, i18n.language) ??
                      t('requestLogs.notAvailable')}
                  </DetailRow>

                  <DetailRow label={t('requestLogs.details.responseSize')}>
                    {formatRequestLogBytes(requestLogDetail.responseSizeBytes, i18n.language) ??
                      t('requestLogs.notAvailable')}
                  </DetailRow>
                </DetailSection>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
