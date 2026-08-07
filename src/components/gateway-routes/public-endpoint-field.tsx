import { CopyField } from '@/components/shared/copy-field';
import { env } from '@/config/env';

interface PublicEndpointFieldProps {
  /** The backend's authoritative public path, e.g. `/gateway/send-whatsapp` — never reconstructed manually. */
  publicPath: string;
  label?: string;
  truncate?: boolean;
}

/**
 * Builds the full public endpoint from the backend's `publicPath` +
 * `VITE_PUBLIC_GATEWAY_URL`. Never uses `destinationUrl` (the internal
 * target) or rebuilds the path from `slug` — `publicPath` is already the
 * exact value the backend computes and serves at `/gateway/*`. Falls back
 * to the relative path alone when the base URL isn't configured (still
 * useful to copy in local development).
 */
export function PublicEndpointField({ publicPath, label, truncate }: PublicEndpointFieldProps) {
  const fullUrl = env.VITE_PUBLIC_GATEWAY_URL
    ? `${env.VITE_PUBLIC_GATEWAY_URL}${publicPath}`
    : publicPath;

  return <CopyField value={fullUrl} label={label} truncate={truncate} />;
}
