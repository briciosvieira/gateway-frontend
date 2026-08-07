import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ClientDeleteDialog } from '@/components/clients/client-delete-dialog';
import { ClientDetailsDrawer } from '@/components/clients/client-details-drawer';
import { ClientFilters } from '@/components/clients/client-filters';
import { CreateClientForm, EditClientForm } from '@/components/clients/client-form';
import { ClientStatusDialog } from '@/components/clients/client-status-dialog';
import { ClientsTable } from '@/components/clients/clients-table';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/use-auth';
import { CLIENTS_PAGE_SIZE, DEFAULT_CLIENTS_FILTERS } from '@/features/clients/clients.constants';
import { useClients } from '@/features/clients/clients.hooks';
import type {
  Client,
  ClientsFilterState,
  FindClientsParams,
} from '@/features/clients/clients.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

type FormDialogState = { mode: 'create' } | { mode: 'edit'; client: Client } | null;

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindClientsParams(filters: ClientsFilterState): FindClientsParams {
  return {
    page: filters.page,
    limit: CLIENTS_PAGE_SIZE,
    search: filters.search || undefined,
    active: filters.status === 'all' ? undefined : filters.status === 'active',
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function ClientsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<ClientsFilterState>(DEFAULT_CLIENTS_FILTERS);
  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [statusClient, setStatusClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<ClientsFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_CLIENTS_FILTERS);
  }

  const params = useMemo(() => toFindClientsParams(filters), [filters]);
  const clientsQuery = useClients(params);
  const rows = clientsQuery.data?.items ?? [];
  const pagination = clientsQuery.data?.pagination;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('clients.title')}
        description={t('clients.description')}
        actions={
          hasPermission('clients.create') && (
            <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
              <Plus className="size-4" aria-hidden="true" />
              {t('clients.new')}
            </Button>
          )
        }
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

      <ClientFilters value={filters} onChange={updateFilters} onClear={clearFilters} />

      <Card className="overflow-hidden p-4">
        {clientsQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(clientsQuery.error, t('clients.error'))}
            requestId={isApiError(clientsQuery.error) ? clientsQuery.error.requestId : undefined}
            onRetry={() => void clientsQuery.refetch()}
          />
        ) : clientsQuery.isLoading ? (
          <TableSkeleton columns={8} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('clients.empty')} />
        ) : (
          <ClientsTable
            rows={rows}
            permissions={{
              canUpdate: hasPermission('clients.update'),
              canChangeStatus: hasPermission('clients.status'),
              canDelete: hasPermission('clients.delete'),
            }}
            onView={setDetailsClient}
            onEdit={(client) => setFormDialog({ mode: 'edit', client })}
            onToggleStatus={setStatusClient}
            onDelete={setDeleteClient}
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
        <CreateClientForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          onSuccess={() => {
            setFormDialog(null);
            showFeedback('success', t('clients.success.created'));
          }}
        />
      )}

      {formDialog?.mode === 'edit' && (
        <EditClientForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          client={formDialog.client}
          onSuccess={() => {
            setFormDialog(null);
            showFeedback('success', t('clients.success.updated'));
          }}
        />
      )}

      {statusClient && (
        <ClientStatusDialog
          open
          client={statusClient}
          onOpenChange={(open) => !open && setStatusClient(null)}
          onSuccess={() => {
            setStatusClient(null);
            showFeedback('success', t('clients.success.statusChanged'));
          }}
        />
      )}

      {deleteClient && (
        <ClientDeleteDialog
          open
          client={deleteClient}
          onOpenChange={(open) => !open && setDeleteClient(null)}
          onSuccess={() => {
            setDeleteClient(null);
            showFeedback('success', t('clients.delete.success'));
          }}
        />
      )}

      <ClientDetailsDrawer
        open={detailsClient !== null}
        client={detailsClient}
        onOpenChange={(open) => !open && setDetailsClient(null)}
      />
    </div>
  );
}
