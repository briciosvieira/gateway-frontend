import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  buildRequestLogEndDate,
  buildRequestLogStartDate,
  formatRequestLogDateTime,
} from '@/features/request-logs/request-logs.utils';

// This app's tsconfig targets the browser (no Node types) — declare just the
// slice of `process.env` this file needs to force a controlled test timezone.
declare const process: { env: { TZ?: string } };

describe('formatRequestLogDateTime', () => {
  it('renders exactly DD/MM/AAAA HH:mm:ss for pt-BR', () => {
    // Built from local wall-clock components so the round-trip through
    // `.toISOString()` and back reproduces the same digits regardless of
    // the machine's timezone running the test.
    const date = new Date(2026, 7, 7, 0, 55, 57);

    expect(formatRequestLogDateTime(date.toISOString(), 'pt-BR')).toBe('07/08/2026 00:55:57');
  });

  it('never inverts to MM/DD/YYYY for pt-BR', () => {
    const date = new Date(2026, 0, 31, 23, 5, 9); // 31 de janeiro — day > 12, would reveal a swapped format
    expect(formatRequestLogDateTime(date.toISOString(), 'pt-BR')).toBe('31/01/2026 23:05:09');
  });

  it('uses the project-standard dateStyle/timeStyle convention for other languages', () => {
    const date = new Date(2026, 7, 7, 0, 55, 57);
    const expected = new Intl.DateTimeFormat('en', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date);

    expect(formatRequestLogDateTime(date.toISOString(), 'en')).toBe(expected);
  });

  it('is the single formatter reused for both attemptedAt and createdAt — no per-field format drift', () => {
    // 2 seconds apart, so the (second-precision) formatted output actually
    // differs, proving both go through the same function with the same
    // options and neither silently gets a different format.
    const attemptedAt = '2026-08-07T13:15:20.616Z';
    const createdAt = '2026-08-07T13:15:22.954Z';

    expect(formatRequestLogDateTime(attemptedAt, 'pt-BR')).not.toBe(
      formatRequestLogDateTime(createdAt, 'pt-BR'),
    );
    expect(formatRequestLogDateTime(attemptedAt, 'pt-BR')).toMatch(
      /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/,
    );
  });
});

describe('formatRequestLogDateTime / date range helpers — fixed UTC-3 timezone', () => {
  const originalTz = process.env.TZ;

  beforeAll(() => {
    // Controlled timezone matching the task's worked examples (Brazil,
    // UTC-3, no DST) — `formatRequestLogDateTime` and the range builders
    // construct their `Date`/`Intl` instances fresh on every call, so this
    // is picked up reliably regardless of test execution order.
    process.env.TZ = 'America/Sao_Paulo';
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('converts a real UTC attemptedAt to the correct pt-BR local wall-clock time', () => {
    // Real example from the fixed backend contract.
    expect(formatRequestLogDateTime('2026-08-07T13:15:20.616Z', 'pt-BR')).toBe(
      '07/08/2026 10:15:20',
    );
  });

  it('builds the start of the local day as the correct UTC instant (00:00 local -> 03:00 UTC)', () => {
    expect(buildRequestLogStartDate('2026-08-07')).toBe('2026-08-07T03:00:00.000Z');
  });

  it('builds the end of the local day as the correct UTC instant (23:59:59.999 local -> next-day 02:59:59.999 UTC)', () => {
    expect(buildRequestLogEndDate('2026-08-07')).toBe('2026-08-08T02:59:59.999Z');
  });
});

describe('buildRequestLogStartDate / buildRequestLogEndDate', () => {
  it('builds the start of the local day (00:00:00.000) from a YYYY-MM-DD input', () => {
    const iso = buildRequestLogStartDate('2026-08-07');
    const date = new Date(iso as string);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7); // August, 0-indexed
    expect(date.getDate()).toBe(7);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('builds the end of the local day (23:59:59.999) from a YYYY-MM-DD input', () => {
    const iso = buildRequestLogEndDate('2026-08-07');
    const date = new Date(iso as string);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(7);
    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
    expect(date.getSeconds()).toBe(59);
    expect(date.getMilliseconds()).toBe(999);
  });

  it('never shifts the selected day to the previous or next day regardless of local timezone offset', () => {
    // A naive `` `${dateInput}T00:00:00.000Z` `` string is UTC midnight —
    // in any negative-offset timezone that renders locally as the previous
    // day, exactly the bug these helpers must avoid. Using local
    // year/month/day components instead guarantees the same day comes back.
    const start = new Date(buildRequestLogStartDate('2026-08-07') as string);
    const end = new Date(buildRequestLogEndDate('2026-08-07') as string);

    expect(start.getDate()).toBe(7);
    expect(end.getDate()).toBe(7);
  });

  it('accepts the same day for start and end (single-day filter is valid)', () => {
    expect(buildRequestLogStartDate('2026-08-07')).toBeDefined();
    expect(buildRequestLogEndDate('2026-08-07')).toBeDefined();
  });

  it('returns undefined for an empty input, so an unset filter is omitted from the query', () => {
    expect(buildRequestLogStartDate('')).toBeUndefined();
    expect(buildRequestLogEndDate('')).toBeUndefined();
  });
});
