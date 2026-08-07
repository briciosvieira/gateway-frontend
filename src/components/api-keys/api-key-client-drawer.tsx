import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiKeyDeleteDialog } from '@/components/api-keys/api-key-delete-dialog';
import { ApiKeyDetailsDrawer } from '@/components/api-keys/api-key-details-drawer';
import { ApiKeyFilters } from '@/components/api-keys/api-key-filters';
import { CreateApiKeyForm, EditApiKeyForm } from '@/components/api-keys/api-key-form';
import { ApiKeyRegenerateDialog } from '@/components/api-keys/api-key-regenerate-dialog';
import { ApiKeyRevealDialog } from '@/components/api-keys/api-key-reveal-dialog';
import { ApiKeyRevokeDialog } from '@/components/api-keys/api-key-revoke-dialog';
import { ApiKeyStatusDialog } from '@/components/api-keys/api-key-status-dialog';
import { ApiKeysTable } from '@/components/api-keys/api-keys-table';
import { ClientResourceDrawerHeader } from '@/components/shared/client-resource-drawer-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  API_KEYS_PAGE_SIZE,
  DEFAULT_API_KEYS_FILTERS,
} from '@/features/api-keys/api-keys.constants';
import { useApiKeys } from '@/features/api-keys/api-keys.hooks';
import type {
  ApiKey,
  ApiKeysFilterState,
  FindApiKeysParams,
} from '@/features/api-keys/api-keys.types';
import { useAuth } from '@/features/auth/use-auth';
import type { ClientRef } from '@/features/clients/clients.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

type FormDialogState = { mode: 'create' } | { mode: 'edit'; apiKey: ApiKey } | null;

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindApiKeysParams(clientId: string, filters: ApiKeysFilterState): FindApiKeysParams {
  return {
    page: filters.page,
    limit: API_KEYS_PAGE_SIZE,
    clientId,
    search: filters.search || undefined,
    active: filters.status === 'all' ? undefined : filters.status === 'active',
    expiresTo: filters.onlyExpired ? new Date().toISOString() : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

interface ApiKeyClientDrawerProps {
  open: boolean;
  client: ClientRef | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Per-client API Keys view — opened from the main "clients" list. Queries
 * `GET /api-keys?clientId=<id>` (real, paginated, filtered), never the full
 * unscoped list. Reuses every existing API Keys component/hook/dialog
 * unchanged; only the client is fixed instead of user-selectable.
 */
export function ApiKeyClientDrawer({ open, client, onOpenChange }: ApiKeyClientDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {client && <ApiKeyClientDrawerContent key={client.id} client={client} />}
    </Sheet>
  );
}

function ApiKeyClientDrawerContent({ client }: { client: ClientRef }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<ApiKeysFilterState>(DEFAULT_API_KEYS_FILTERS);
  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [statusApiKey, setStatusApiKey] = useState<ApiKey | null>(null);
  const [revokeApiKey, setRevokeApiKey] = useState<ApiKey | null>(null);
  const [regenerateApiKey, setRegenerateApiKey] = useState<ApiKey | null>(null);
  const [deleteApiKey, setDeleteApiKey] = useState<ApiKey | null>(null);
  const [detailsApiKey, setDetailsApiKey] = useState<ApiKey | null>(null);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<ApiKeysFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_API_KEYS_FILTERS);
  }

  const params = useMemo(() => toFindApiKeysParams(client.id, filters), [client.id, filters]);
  const apiKeysQuery = useApiKeys(params);
  const rows = apiKeysQuery.data?.items ?? [];
  const pagination = apiKeysQuery.data?.pagination;

  return (
    <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-4xl">
      <ClientResourceDrawerHeader
        title={t('apiKeys.clientDrawer.title', { name: client.name })}
        client={client}
      />

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

      {hasPermission('apiKeys.create') && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
            <Plus className="size-4" aria-hidden="true" />
            {t('apiKeys.new')}
          </Button>
        </div>
      )}

      <ApiKeyFilters
        value={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        showClientFilter={false}
      />

      <Card className="overflow-hidden p-4">
        {apiKeysQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(apiKeysQuery.error, t('apiKeys.error'))}
            requestId={isApiError(apiKeysQuery.error) ? apiKeysQuery.error.requestId : undefined}
            onRetry={() => void apiKeysQuery.refetch()}
          />
        ) : apiKeysQuery.isLoading ? (
          <TableSkeleton columns={8} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('apiKeys.clientDrawer.empty')} />
        ) : (
          <ApiKeysTable
            rows={rows}
            permissions={{
              canUpdate: hasPermission('apiKeys.update'),
              canChangeStatus: hasPermission('apiKeys.status'),
              canRevoke: hasPermission('apiKeys.revoke'),
              canRegenerate: hasPermission('apiKeys.regenerate'),
              canDelete: hasPermission('apiKeys.delete'),
            }}
            onView={setDetailsApiKey}
            onEdit={(apiKey) => setFormDialog({ mode: 'edit', apiKey })}
            onToggleStatus={setStatusApiKey}
            onRevoke={setRevokeApiKey}
            onRegenerate={setRegenerateApiKey}
            onDelete={setDeleteApiKey}
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

      {formDialog?.mode === 'create' && (
        <CreateApiKeyForm
          open
          lockedClient={client}
          onOpenChange={(open) => !open && setFormDialog(null)}
          onSuccess={(result) => {
            setFormDialog(null);
            showFeedback('success', t('apiKeys.success.created'));
            setRevealKey(result.key);
          }}
        />
      )}

      {formDialog?.mode === 'edit' && (
        <EditApiKeyForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          apiKey={formDialog.apiKey}
          onSuccess={() => {
            setFormDialog(null);
            showFeedback('success', t('apiKeys.success.updated'));
          }}
        />
      )}

      {statusApiKey && (
        <ApiKeyStatusDialog
          open
          apiKey={statusApiKey}
          onOpenChange={(open) => !open && setStatusApiKey(null)}
          onSuccess={() => {
            setStatusApiKey(null);
            showFeedback('success', t('apiKeys.success.statusChanged'));
          }}
        />
      )}

      {revokeApiKey && (
        <ApiKeyRevokeDialog
          open
          apiKey={revokeApiKey}
          onOpenChange={(open) => !open && setRevokeApiKey(null)}
          onSuccess={() => {
            setRevokeApiKey(null);
            showFeedback('success', t('apiKeys.success.revoked'));
          }}
        />
      )}

      {regenerateApiKey && (
        <ApiKeyRegenerateDialog
          open
          apiKey={regenerateApiKey}
          onOpenChange={(open) => !open && setRegenerateApiKey(null)}
          onSuccess={(result) => {
            setRegenerateApiKey(null);
            showFeedback('success', t('apiKeys.success.regenerated'));
            setRevealKey(result.key);
          }}
        />
      )}

      {deleteApiKey && (
        <ApiKeyDeleteDialog
          open
          apiKey={deleteApiKey}
          onOpenChange={(open) => !open && setDeleteApiKey(null)}
          onSuccess={() => {
            setDeleteApiKey(null);
            showFeedback('success', t('apiKeys.delete.success'));
          }}
        />
      )}

      <ApiKeyDetailsDrawer
        open={detailsApiKey !== null}
        apiKey={detailsApiKey}
        onOpenChange={(open) => !open && setDetailsApiKey(null)}
      />

      {revealKey && (
        <ApiKeyRevealDialog open apiKey={revealKey} onClose={() => setRevealKey(null)} />
      )}
    </SheetContent>
  );
}
