import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCreateUser, useUpdateUser } from '@/features/users/users.hooks';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from '@/features/users/users.schemas';
import type { AssignableRole, CreateUserResult, UserListItem } from '@/features/users/users.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface CreateUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: AssignableRole[];
  onSuccess: (result: CreateUserResult) => void;
}

export function CreateUserForm({ open, onOpenChange, roles, onSuccess }: CreateUserFormProps) {
  const { t } = useTranslation();
  const mutation = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', username: '', email: '', roleId: '', requirePasswordChange: true },
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(values: CreateUserFormValues) {
    try {
      const result = await mutation.mutateAsync(values);
      reset();
      onSuccess(result);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.form.createTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="create-user-name" className="text-sm font-medium">
              {t('users.form.name')}
            </label>
            <Input id="create-user-name" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-user-username" className="text-sm font-medium">
              {t('users.form.username')}
            </label>
            <Input id="create-user-username" autoComplete="off" {...register('username')} />
            {errors.username?.message && (
              <p className="text-sm text-destructive">{t(errors.username.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-user-email" className="text-sm font-medium">
              {t('users.form.email')}
            </label>
            <Input id="create-user-email" type="email" {...register('email')} />
            {errors.email?.message && (
              <p className="text-sm text-destructive">{t(errors.email.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-user-role" className="text-sm font-medium">
              {t('users.form.role')}
            </label>
            <select
              id="create-user-role"
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('roleId')}
            >
              <option value="">{t('users.form.rolePlaceholder')}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {t(`auth.roles.${role.code}`)}
                </option>
              ))}
            </select>
            {errors.roleId?.message && (
              <p className="text-sm text-destructive">{t(errors.roleId.message)}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" {...register('requirePasswordChange')} />
            {t('users.form.requirePasswordChange')}
          </label>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('users.error'))}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('shared.confirm.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('shared.confirm.loading') : t('users.form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem;
  onSuccess: () => void;
}

export function EditUserForm({ open, onOpenChange, user, onSuccess }: EditUserFormProps) {
  const { t } = useTranslation();
  const mutation = useUpdateUser(user.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: user.name, username: user.username, email: user.email },
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset({ name: user.name, username: user.username, email: user.email });
    onOpenChange(next);
  }

  async function onSubmit(values: UpdateUserFormValues) {
    const payload: Partial<UpdateUserFormValues> = {};
    if (values.name !== user.name) payload.name = values.name;
    if (values.username !== user.username) payload.username = values.username;
    if (values.email !== user.email) payload.email = values.email;

    try {
      if (Object.keys(payload).length > 0) {
        await mutation.mutateAsync(payload);
      }
      onSuccess();
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="edit-user-name" className="text-sm font-medium">
              {t('users.form.name')}
            </label>
            <Input id="edit-user-name" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-user-username" className="text-sm font-medium">
              {t('users.form.username')}
            </label>
            <Input id="edit-user-username" autoComplete="off" {...register('username')} />
            {errors.username?.message && (
              <p className="text-sm text-destructive">{t(errors.username.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-user-email" className="text-sm font-medium">
              {t('users.form.email')}
            </label>
            <Input id="edit-user-email" type="email" {...register('email')} />
            {errors.email?.message && (
              <p className="text-sm text-destructive">{t(errors.email.message)}</p>
            )}
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('users.error'))}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('shared.confirm.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('shared.confirm.loading') : t('users.form.submitEdit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
