import { z } from 'zod';

const routeHeaderNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'routeHeaders.form.errors.nameRequired' })
  .max(100, { message: 'routeHeaders.form.errors.nameLength' });

const routeHeaderValueSchema = z
  .string()
  .trim()
  .min(1, { message: 'routeHeaders.form.errors.valueRequired' })
  .max(4000, { message: 'routeHeaders.form.errors.valueLength' });

const optionalRouteHeaderValueSchema = z
  .string()
  .trim()
  .max(4000, { message: 'routeHeaders.form.errors.valueLength' });

export const createRouteHeaderSchema = z.object({
  name: routeHeaderNameSchema,
  value: routeHeaderValueSchema,
  sensitive: z.boolean(),
});

export type CreateRouteHeaderFormValues = z.infer<typeof createRouteHeaderSchema>;

export const updateRouteHeaderSchema = z.object({
  name: routeHeaderNameSchema,
  value: optionalRouteHeaderValueSchema,
  sensitive: z.boolean(),
});

export type UpdateRouteHeaderFormValues = z.infer<typeof updateRouteHeaderSchema>;
