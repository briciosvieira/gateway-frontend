import { z } from 'zod';

/**
 * Mirrors `CreateApiKeyDto`/`UpdateApiKeyDto`
 * (src/modules/api-keys/dto/{create-api-key,update-api-key}.dto.ts) — same
 * min/max length. `clientId` is deliberately NOT part of this schema: it's
 * selected via a combobox (component state), not a plain input, and
 * validated separately in the form component. There is no `description`
 * field on the real backend DTO — omitted here even though earlier stage
 * specs mentioned one (see the Etapa 8 delivery report).
 */
const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'apiKeys.form.errors.nameLength' })
  .max(150, { message: 'apiKeys.form.errors.nameLength' });

const optionalExpiresAtSchema = z.string().optional().or(z.literal(''));

export const createApiKeySchema = z.object({
  name: nameSchema,
  expiresAt: optionalExpiresAtSchema,
});

export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  name: nameSchema,
  expiresAt: optionalExpiresAtSchema,
});

export type UpdateApiKeyFormValues = z.infer<typeof updateApiKeySchema>;
