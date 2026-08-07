import { z } from 'zod';

/**
 * Mirrors `CreateGatewayRouteDto`/`UpdateGatewayRouteDto`
 * (src/modules/gateway-routes/dto/{create-gateway-route,update-gateway-route}.dto.ts)
 * at the DTO layer only. `slug` and `destinationUrl` get only basic format
 * checks here (non-empty, max length, `.url()`) — the backend's real
 * normalization/validation (reserved-prefix rejection, protocol/credential/
 * fragment checks) is deliberately NOT reimplemented, to avoid
 * accepting/rejecting differently than the real API. Invalid input surfaces
 * as a translated 400 error from the real request instead.
 */
const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'gatewayRoutes.form.errors.nameLength' })
  .max(150, { message: 'gatewayRoutes.form.errors.nameLength' });

const slugSchema = z
  .string()
  .trim()
  .min(1, { message: 'gatewayRoutes.form.errors.slugRequired' })
  .max(255, { message: 'gatewayRoutes.form.errors.slugLength' });

const destinationUrlSchema = z
  .string()
  .trim()
  .min(1, { message: 'gatewayRoutes.form.errors.destinationUrlRequired' })
  .max(2000, { message: 'gatewayRoutes.form.errors.destinationUrlLength' })
  .url({ message: 'gatewayRoutes.form.errors.destinationUrlInvalid' });

const methodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], {
  message: 'gatewayRoutes.form.errors.methodRequired',
});

const timeoutMsSchema = z
  .number({ message: 'gatewayRoutes.form.errors.timeoutRequired' })
  .int()
  .min(1000, { message: 'gatewayRoutes.form.errors.timeoutRange' })
  .max(120000, { message: 'gatewayRoutes.form.errors.timeoutRange' });

const retryCountSchema = z
  .number({ message: 'gatewayRoutes.form.errors.retryRequired' })
  .int()
  .min(0, { message: 'gatewayRoutes.form.errors.retryRange' })
  .max(5, { message: 'gatewayRoutes.form.errors.retryRange' });

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500, { message: 'gatewayRoutes.form.errors.descriptionLength' })
  .optional()
  .or(z.literal(''));

export const createGatewayRouteSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  destinationUrl: destinationUrlSchema,
  method: methodSchema,
  description: optionalDescriptionSchema,
  timeoutMs: timeoutMsSchema,
  retryCount: retryCountSchema,
});

export type CreateGatewayRouteFormValues = z.infer<typeof createGatewayRouteSchema>;

export const updateGatewayRouteSchema = createGatewayRouteSchema;

export type UpdateGatewayRouteFormValues = z.infer<typeof updateGatewayRouteSchema>;
