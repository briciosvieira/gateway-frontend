import { z } from 'zod';

/**
 * Mirrors `CreateClientDto`/`UpdateClientDto`
 * (src/modules/clients/dto/{create-client,update-client}.dto.ts) exactly —
 * same min/max lengths and the same `code` regex the backend enforces.
 */
const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'clients.form.errors.nameLength' })
  .max(150, { message: 'clients.form.errors.nameLength' });

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500, { message: 'clients.form.errors.descriptionLength' })
  .optional()
  .or(z.literal(''));

const optionalContactNameSchema = z
  .string()
  .trim()
  .max(150, { message: 'clients.form.errors.contactNameLength' })
  .optional()
  .or(z.literal(''));

const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, { message: 'clients.form.errors.emailInvalid' })
  .email({ message: 'clients.form.errors.emailInvalid' })
  .optional()
  .or(z.literal(''));

export const createClientSchema = z.object({
  name: nameSchema,
  description: optionalDescriptionSchema,
  contactName: optionalContactNameSchema,
  contactEmail: optionalEmailSchema,
});

export type CreateClientFormValues = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema;

export type UpdateClientFormValues = z.infer<typeof updateClientSchema>;
