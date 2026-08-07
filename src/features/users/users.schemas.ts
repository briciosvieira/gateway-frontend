import { z } from 'zod';

/**
 * Mirrors `CreateUserDto`/`UpdateUserDto`
 * (src/modules/users/dto/{create-user,update-user}.dto.ts) exactly — same
 * min/max lengths and the same username regex the backend enforces.
 */
const nameSchema = z
  .string()
  .trim()
  .min(3, { message: 'users.form.errors.nameLength' })
  .max(150, { message: 'users.form.errors.nameLength' });

const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: 'users.form.errors.usernameLength' })
  .max(50, { message: 'users.form.errors.usernameLength' })
  .regex(/^[a-zA-Z0-9._-]+$/, { message: 'users.form.errors.usernameFormat' });

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'users.form.errors.emailInvalid' })
  .max(255, { message: 'users.form.errors.emailInvalid' });

export const createUserSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  roleId: z.string().min(1, { message: 'users.form.errors.roleRequired' }),
  requirePasswordChange: z.boolean(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
