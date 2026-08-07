import { CERTIFICATE_EXPIRING_SOON_DAYS } from '@/features/trusted-cas/trusted-cas.constants';

export type CertificateValidityStatus = 'valid' | 'expiring' | 'expired';

export function formatCertificateFingerprintPreview(fingerprint: string): string {
  const groups = fingerprint.split(':');

  if (groups.length <= 5) {
    return fingerprint;
  }

  return `${groups.slice(0, 5).join(':')}...`;
}

/**
 * Frontend-only visual classification derived from `validTo` — never sent
 * to the backend, never changes the record's `active` flag, and never
 * triggers a mutation automatically. The backend/TLS stack remains the
 * sole authority on real certificate validity; this only helps an ADMIN
 * spot certificates that need attention.
 *
 * - `validTo` more than 30 days away → `'valid'`
 * - `validTo` within the next 30 days (inclusive) → `'expiring'`
 * - `validTo` in the past → `'expired'`
 */
export function getCertificateValidityStatus(
  validTo: string,
  now: Date = new Date(),
): CertificateValidityStatus {
  const validToTime = new Date(validTo).getTime();
  const nowTime = now.getTime();

  if (validToTime < nowTime) return 'expired';

  const expiringThreshold = nowTime + CERTIFICATE_EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
  if (validToTime <= expiringThreshold) return 'expiring';

  return 'valid';
}
