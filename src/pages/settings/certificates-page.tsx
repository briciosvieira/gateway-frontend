import { Info, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { TrustedCaDeleteDialog } from '@/components/trusted-cas/trusted-ca-delete-dialog';
import { TrustedCaFilters } from '@/components/trusted-cas/trusted-ca-filters';
import { CreateTrustedCaForm } from '@/components/trusted-cas/trusted-ca-form';
import { TrustedCaStatusDialog } from '@/components/trusted-cas/trusted-ca-status-dialog';
import { TrustedCasTable } from '@/components/trusted-cas/trusted-cas-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/use-auth';
import {
  DEFAULT_TRUSTED_CAS_FILTERS,
  TRUSTED_CAS_PAGE_SIZE,
} from '@/features/trusted-cas/trusted-cas.constants';
import { useTrustedCas } from '@/features/trusted-cas/trusted-cas.hooks';
import type {
  FindTrustedCasParams,
  TrustedCa,
  TrustedCasFilterState,
} from '@/features/trusted-cas/trusted-cas.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindTrustedCasParams(filters: TrustedCasFilterState): FindTrustedCasParams {
  return {
    page: filters.page,
    limit: TRUSTED_CAS_PAGE_SIZE,
    search: filters.search || undefined,
    active: filters.status === 'all' ? undefined : filters.status === 'active',
    validity: filters.validity === 'all' ? undefined : filters.validity,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function CertificatesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<TrustedCasFilterState>(DEFAULT_TRUSTED_CAS_FILTERS);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusTrustedCa, setStatusTrustedCa] = useState<TrustedCa | null>(null);
  const [deleteTrustedCa, setDeleteTrustedCa] = useState<TrustedCa | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<TrustedCasFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_TRUSTED_CAS_FILTERS);
  }

  const params = useMemo(() => toFindTrustedCasParams(filters), [filters]);
  const trustedCasQuery = useTrustedCas(params);
  const rows = trustedCasQuery.data?.items ?? [];
  const pagination = trustedCasQuery.data?.pagination;

  const canCreate = hasPermission('trustedCas.create');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {t('settings.certificates.title')}
          </h2>
          <p className="text-sm font-medium text-foreground/75">
            {t('settings.certificates.subtitle')}
          </p>
          <p className="max-w-3xl min-w-0 text-sm leading-6 text-muted break-words">
            {t('settings.certificates.description')}
          </p>
        </div>
        {canCreate && (
          <Button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="shrink-0 self-start"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('settings.certificates.new')}
          </Button>
        )}
      </div>

      <p className="flex items-start gap-1.5 rounded-lg border border-border/60 bg-surface/70 px-3 py-2.5 text-xs leading-5 text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t('settings.certificates.info')}
      </p>

      {feedback && (
        <p
          role="status"
          className={
            feedback.type === 'success'
              ? 'rounded-md bg-primary/10 px-4 py-2 text-sm text-primary'
              : 'rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive'
          }
        >
          {feedback.message}
        </p>
      )}

      <TrustedCaFilters value={filters} onChange={updateFilters} onClear={clearFilters} />

      <Card className="overflow-hidden p-4">
        {trustedCasQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(trustedCasQuery.error, t('settings.certificates.error'))}
            requestId={
              isApiError(trustedCasQuery.error) ? trustedCasQuery.error.requestId : undefined
            }
            onRetry={() => void trustedCasQuery.refetch()}
          />
        ) : trustedCasQuery.isLoading ? (
          <TableSkeleton columns={10} />
        ) : rows.length === 0 ? (
          <TableEmptyState
            message={t('settings.certificates.empty.title')}
            description={t('settings.certificates.empty.description')}
            action={
              canCreate && (
                <Button type="button" size="sm" onClick={() => setShowCreateForm(true)}>
                  <Plus className="size-4" aria-hidden="true" />
                  {t('settings.certificates.new')}
                </Button>
              )
            }
          />
        ) : (
          <TrustedCasTable
            rows={rows}
            permissions={{
              canChangeStatus: hasPermission('trustedCas.status'),
              canDelete: hasPermission('trustedCas.delete'),
            }}
            onToggleStatus={setStatusTrustedCa}
            onDelete={setDeleteTrustedCa}
          />
        )}
      </Card>

      {pagination && (
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onPageChange={(page) => updateFilters({ page })}
        />
      )}

      {showCreateForm && (
        <CreateTrustedCaForm
          open
          onOpenChange={setShowCreateForm}
          onSuccess={(trustedCa) => {
            setShowCreateForm(false);
            showFeedback(
              'success',
              t('settings.certificates.success.created', { name: trustedCa.name }),
            );
          }}
        />
      )}

      {statusTrustedCa && (
        <TrustedCaStatusDialog
          open
          trustedCa={statusTrustedCa}
          onOpenChange={(open) => !open && setStatusTrustedCa(null)}
          onSuccess={() => {
            setStatusTrustedCa(null);
            showFeedback('success', t('settings.certificates.success.statusChanged'));
          }}
        />
      )}

      {deleteTrustedCa && (
        <TrustedCaDeleteDialog
          open
          trustedCa={deleteTrustedCa}
          onOpenChange={(open) => !open && setDeleteTrustedCa(null)}
          onSuccess={() => {
            setDeleteTrustedCa(null);
            showFeedback('success', t('settings.certificates.success.deleted'));
          }}
        />
      )}
    </div>
  );
}
