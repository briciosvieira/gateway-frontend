import { z } from 'zod';

/**
 * Mirrors `TrustedCasService.normalizeName` exactly
 * (src/modules/trusted-cas/trusted-cas.service.ts): trimmed length must be
 * between 3 and 120 characters. The certificate file itself is validated
 * entirely server-side (format, CA flag, expiry, private-key rejection) —
 * the frontend only does the basic extension/required checks described in
 * the task, never a full X.509 parse.
 */
const nameSchema = z
  .string()
  .trim()
  .min(3, { message: 'settings.certificates.form.errors.nameLength' })
  .max(120, { message: 'settings.certificates.form.errors.nameLength' });

export const createTrustedCaSchema = z.object({
  name: nameSchema,
});

export type CreateTrustedCaFormValues = z.infer<typeof createTrustedCaSchema>;
