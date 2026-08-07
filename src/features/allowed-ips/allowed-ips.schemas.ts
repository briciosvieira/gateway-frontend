import { z } from 'zod';

/**
 * Mirrors `CreateAllowedIpDto`/`UpdateAllowedIpDto`
 * (src/modules/allowed-ips/dto/{create-allowed-ip,update-allowed-ip}.dto.ts)
 * at the DTO layer only: `address` is just a required non-empty string
 * (max 100). The real IP/CIDR format validation happens server-side via
 * `ipaddr.js` (`parseAllowedIpAddress`) — deliberately NOT reimplemented
 * here, to avoid rejecting/accepting values differently than the backend
 * actually does. Invalid input surfaces as a translated 400 error from the
 * real request instead.
 */
const addressSchema = z
  .string()
  .trim()
  .min(1, { message: 'allowedIps.form.errors.addressRequired' })
  .max(100, { message: 'allowedIps.form.errors.addressLength' });

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500, { message: 'allowedIps.form.errors.descriptionLength' })
  .optional()
  .or(z.literal(''));

export const createAllowedIpSchema = z.object({
  address: addressSchema,
  description: optionalDescriptionSchema,
});

export type CreateAllowedIpFormValues = z.infer<typeof createAllowedIpSchema>;

export const updateAllowedIpSchema = z.object({
  address: addressSchema,
  description: optionalDescriptionSchema,
});

export type UpdateAllowedIpFormValues = z.infer<typeof updateAllowedIpSchema>;
