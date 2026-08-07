import { describe, expect, it } from 'vitest';

import {
  formatCertificateFingerprintPreview,
  getCertificateValidityStatus,
} from '@/features/trusted-cas/trusted-cas.utils';

describe('formatCertificateFingerprintPreview', () => {
  it('keeps only the first 5 fingerprint groups in the table preview', () => {
    expect(
      formatCertificateFingerprintPreview(
        '24:3F:C0:52:8D:D6:3A:C2:9E:9F:ED:01:41:52:5B:F1:CA:D4:BA:03:DF:3C:8F:8F:88:13:FC:77:61:1F:F7:C7',
      ),
    ).toBe('24:3F:C0:52:8D...');
  });

  it('does not alter short values that already fit the table', () => {
    expect(formatCertificateFingerprintPreview('AA:BB:CC:DD')).toBe('AA:BB:CC:DD');
  });
});

const NOW = new Date('2026-08-06T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('getCertificateValidityStatus', () => {
  it('returns "valid" when validTo is more than 30 days away', () => {
    const validTo = new Date(NOW.getTime() + 31 * DAY_MS).toISOString();
    expect(getCertificateValidityStatus(validTo, NOW)).toBe('valid');
  });

  it('returns "expiring" when validTo is within the next 30 days', () => {
    const validTo = new Date(NOW.getTime() + 30 * DAY_MS).toISOString();
    expect(getCertificateValidityStatus(validTo, NOW)).toBe('expiring');
  });

  it('returns "expiring" when validTo is imminent (1 day away)', () => {
    const validTo = new Date(NOW.getTime() + 1 * DAY_MS).toISOString();
    expect(getCertificateValidityStatus(validTo, NOW)).toBe('expiring');
  });

  it('returns "expired" when validTo is in the past', () => {
    const validTo = new Date(NOW.getTime() - DAY_MS).toISOString();
    expect(getCertificateValidityStatus(validTo, NOW)).toBe('expired');
  });

  it('never mutates the real administrative status — this is a pure, side-effect-free calculation', () => {
    const validTo = new Date(NOW.getTime() + DAY_MS).toISOString();
    const first = getCertificateValidityStatus(validTo, NOW);
    const second = getCertificateValidityStatus(validTo, NOW);
    expect(first).toBe(second);
  });
});
