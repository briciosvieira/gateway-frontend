import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AllowedIpDeleteDialog } from '@/components/allowed-ips/allowed-ip-delete-dialog';
import { AllowedIpDetailsDrawer } from '@/components/allowed-ips/allowed-ip-details-drawer';
import { AllowedIpFilters } from '@/components/allowed-ips/allowed-ip-filters';
import { CreateAllowedIpForm, EditAllowedIpForm } from '@/components/allowed-ips/allowed-ip-form';
import { AllowedIpStatusDialog } from '@/components/allowed-ips/allowed-ip-status-dialog';
import { AllowedIpsTable } from '@/components/allowed-ips/allowed-ips-table';
import { ClientResourceDrawerHeader } from '@/components/shared/client-resource-drawer-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  ALLOWED_IPS_PAGE_SIZE,
  DEFAULT_ALLOWED_IPS_FILTERS,
} from '@/features/allowed-ips/allowed-ips.constants';
import { useAllowedIps } from '@/features/allowed-ips/allowed-ips.hooks';
import type {
  AllowedIp,
  AllowedIpsFilterState,
  FindAllowedIpsParams,
} from '@/features/allowed-ips/allowed-ips.types';
import { useAuth } from '@/features/auth/use-auth';
import type { ClientRef } from '@/features/clients/clients.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

type FormDialogState = { mode: 'create' } | { mode: 'edit'; allowedIp: AllowedIp } | null;

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindAllowedIpsParams(
  clientId: string,
  filters: AllowedIpsFilterState,
): FindAllowedIpsParams {
  return {
    page: filters.page,
    limit: ALLOWED_IPS_PAGE_SIZE,
    clientId,
    search: filters.search || undefined,
    type: filters.type === 'all' ? undefined : filters.type,
    active: filters.status === 'all' ? undefined : filters.status === 'active',
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

interface AllowedIpClientDrawerProps {
  open: boolean;
  client: ClientRef | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Per-client Allowed IPs view — opened from the main "clients" list. Queries
 * `GET /allowed-ips?clientId=<id>` (real, paginated, filtered), never the
 * full unscoped list. Reuses every existing Allowed IPs component/hook/
 * dialog unchanged; only the client is fixed instead of user-selectable.
 */
export function AllowedIpClientDrawer({ open, client, onOpenChange }: AllowedIpClientDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {client && <AllowedIpClientDrawerContent key={client.id} client={client} />}
    </Sheet>
  );
}

function AllowedIpClientDrawerContent({ client }: { client: ClientRef }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<AllowedIpsFilterState>(DEFAULT_ALLOWED_IPS_FILTERS);
  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [statusAllowedIp, setStatusAllowedIp] = useState<AllowedIp | null>(null);
  const [deleteAllowedIp, setDeleteAllowedIp] = useState<AllowedIp | null>(null);
  const [detailsAllowedIp, setDetailsAllowedIp] = useState<AllowedIp | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<AllowedIpsFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_ALLOWED_IPS_FILTERS);
  }

  const params = useMemo(() => toFindAllowedIpsParams(client.id, filters), [client.id, filters]);
  const allowedIpsQuery = useAllowedIps(params);
  const rows = allowedIpsQuery.data?.items ?? [];
  const pagination = allowedIpsQuery.data?.pagination;

  return (
    <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-4xl">
      <ClientResourceDrawerHeader
        title={t('allowedIps.clientDrawer.title', { name: client.name })}
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

      {hasPermission('allowedIps.create') && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
            <Plus className="size-4" aria-hidden="true" />
            {t('allowedIps.new')}
          </Button>
        </div>
      )}

      <AllowedIpFilters
        value={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        showClientFilter={false}
      />

      <Card className="overflow-hidden p-4">
        {allowedIpsQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(allowedIpsQuery.error, t('allowedIps.error'))}
            requestId={
              isApiError(allowedIpsQuery.error) ? allowedIpsQuery.error.requestId : undefined
            }
            onRetry={() => void allowedIpsQuery.refetch()}
          />
        ) : allowedIpsQuery.isLoading ? (
          <TableSkeleton columns={7} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('allowedIps.clientDrawer.empty')} />
        ) : (
          <AllowedIpsTable
            rows={rows}
            permissions={{
              canUpdate: hasPermission('allowedIps.update'),
              canChangeStatus: hasPermission('allowedIps.status'),
              canDelete: hasPermission('allowedIps.delete'),
            }}
            onView={setDetailsAllowedIp}
            onEdit={(allowedIp) => setFormDialog({ mode: 'edit', allowedIp })}
            onToggleStatus={setStatusAllowedIp}
            onDelete={setDeleteAllowedIp}
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
        <CreateAllowedIpForm
          open
          lockedClient={client}
          onOpenChange={(open) => !open && setFormDialog(null)}
          onSuccess={(result) => {
            setFormDialog(null);
            showFeedback('success', t('allowedIps.success.created', { address: result.address }));
          }}
        />
      )}

      {formDialog?.mode === 'edit' && (
        <EditAllowedIpForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          allowedIp={formDialog.allowedIp}
          onSuccess={(result) => {
            setFormDialog(null);
            showFeedback('success', t('allowedIps.success.updated', { address: result.address }));
          }}
        />
      )}

      {statusAllowedIp && (
        <AllowedIpStatusDialog
          open
          allowedIp={statusAllowedIp}
          onOpenChange={(open) => !open && setStatusAllowedIp(null)}
          onSuccess={() => {
            setStatusAllowedIp(null);
            showFeedback('success', t('allowedIps.success.statusChanged'));
          }}
        />
      )}

      {deleteAllowedIp && (
        <AllowedIpDeleteDialog
          open
          allowedIp={deleteAllowedIp}
          onOpenChange={(open) => !open && setDeleteAllowedIp(null)}
          onSuccess={() => {
            setDeleteAllowedIp(null);
            showFeedback('success', t('allowedIps.delete.success'));
          }}
        />
      )}

      <AllowedIpDetailsDrawer
        open={detailsAllowedIp !== null}
        allowedIp={detailsAllowedIp}
        onOpenChange={(open) => !open && setDetailsAllowedIp(null)}
      />
    </SheetContent>
  );
}
