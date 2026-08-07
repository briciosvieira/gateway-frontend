import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/shared/role-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { UserListItem } from '@/features/users/users.types';

interface UserDetailsDrawerProps {
  open: boolean;
  user: UserListItem | null;
  onOpenChange: (open: boolean) => void;
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="space-y-1 border-b border-sidebar-border py-3">
      <p className="text-xs font-medium text-sidebar-muted">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function UserDetailsDrawer({ open, user, onOpenChange }: UserDetailsDrawerProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  function formatDate(value: string | null) {
    return value ? dateFormatter.format(new Date(value)) : t('users.table.never');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        <SheetTitle>{user?.name}</SheetTitle>
        <SheetDescription className="sr-only">{t('users.details.title')}</SheetDescription>

        {user && (
          <div className="mt-2">
            <DetailRow label={t('users.form.name')}>{user.name}</DetailRow>
            <DetailRow label={t('users.form.username')}>
              <span className="font-mono text-xs">{user.username}</span>
            </DetailRow>
            <DetailRow label={t('users.form.email')}>{user.email}</DetailRow>
            <DetailRow label={t('users.table.role')}>
              <RoleBadge code={user.role.code} />
            </DetailRow>
            <DetailRow label={t('users.table.status')}>
              <StatusBadge active={user.active} />
            </DetailRow>
            <DetailRow label={t('users.table.firstLogin')}>
              {t(user.firstLogin ? 'users.table.pending' : 'users.table.completed')}
            </DetailRow>
            <DetailRow label={t('users.table.lastLogin')}>{formatDate(user.lastLoginAt)}</DetailRow>
            <DetailRow label={t('users.table.createdAt')}>{formatDate(user.createdAt)}</DetailRow>
            <DetailRow label={t('users.details.updatedAt')}>{formatDate(user.updatedAt)}</DetailRow>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
