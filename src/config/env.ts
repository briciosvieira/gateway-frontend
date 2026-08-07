import { z } from 'zod';

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1),
  VITE_API_URL: z.string().url(),
  VITE_REQUEST_TIMEOUT: z.coerce.number().int().positive(),
  /**
   * Base URL of the gateway's public proxy (the `/gateway/*` prefix, see
   * `gateway-proxy.controller.ts` on the backend) — used only to display
   * the public endpoint after creating/regenerating an API Key. Optional:
   * an API Key is client-scoped (no fixed route), so this is informational
   * only, never sent to any backend endpoint.
   */
  VITE_PUBLIC_GATEWAY_URL: z.string().url().optional(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error(
    'Invalid frontend environment configuration.',
    parsedEnv.error.flatten().fieldErrors,
  );

  throw new Error('Invalid frontend environment configuration.');
}

export const env = parsedEnv.data;
