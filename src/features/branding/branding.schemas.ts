import { z } from 'zod';

/**
 * Mirrors the backend's `UpdateBrandingDto` exactly (confirmed against the
 * live OpenAPI schema): trimmed length between 2 and 100 characters.
 * Additionally rejects `<`/`>` client-side — the applicationName is
 * rendered as plain text in several places (Sidebar, document title,
 * Home/Login) and must never carry markup; the backend remains the final
 * authority on content validation.
 */
const applicationNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'settings.personalization.form.errors.nameLength' })
  .max(100, { message: 'settings.personalization.form.errors.nameLength' })
  .refine((value) => !/[<>]/.test(value), {
    message: 'settings.personalization.form.errors.nameInvalidChars',
  });

export const updateBrandingNameSchema = z.object({
  applicationName: applicationNameSchema,
});

export type UpdateBrandingNameFormValues = z.infer<typeof updateBrandingNameSchema>;
