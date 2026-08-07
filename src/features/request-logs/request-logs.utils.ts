/**
 * Central date/time formatter for Request Logs — the single place both the
 * table's "Horário" column and the details drawer's "Horário da
 * tentativa"/"Criado em" rows format a timestamp, so the two never drift
 * into different formats. `value` is always a real backend UTC ISO string
 * (e.g. `attemptedAt` or `createdAt`); `new Date(value)` plus `Intl` handles
 * the UTC → local-timezone conversion automatically — never parse the ISO
 * string manually. pt-BR always renders as `DD/MM/AAAA HH:mm:ss` — built
 * from explicit fixed 2-digit fields and joined with a literal space,
 * rather than the `dateStyle`/`timeStyle` shorthand, whose exact output
 * (e.g. 2- vs 4-digit year, separator) is locale-data/ICU-version
 * dependent and this column is used for operational/audit purposes. Other
 * supported languages use the project's existing `dateStyle`/`timeStyle`
 * convention (already used everywhere else in the app) rather than a
 * second bespoke format. The formatters are constructed fresh on every
 * call (not cached module-level) so they always reflect the environment's
 * current local timezone.
 */
export function formatRequestLogDateTime(value: string, locale: string): string {
  const date = new Date(value);

  if (locale === 'pt-BR') {
    const datePart = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
    const timePart = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(date);

    return `${datePart} ${timePart}`;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

function parseDateInputParts(dateInput: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return null;

  const [, year, month, day] = match;
  return [Number(year), Number(month), Number(day)];
}

/**
 * Builds the real `startDate` query value from the raw `YYYY-MM-DD` string
 * produced by `<input type="date">`: the start of that day (00:00:00.000)
 * in the browser's local timezone, converted to a UTC ISO instant only at
 * this boundary via `Date`'s local constructor + `toISOString()`. Never a
 * naive `` `${dateInput}T00:00:00.000Z` `` string concatenation — that
 * treats the bare date as UTC midnight, which shifts the selected day for
 * any non-UTC local timezone.
 */
export function buildRequestLogStartDate(dateInput: string): string | undefined {
  const parts = parseDateInputParts(dateInput);
  if (!parts) return undefined;

  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

/**
 * Builds the real `endDate` query value from the raw `YYYY-MM-DD` string
 * produced by `<input type="date">`: the end of that day (23:59:59.999) in
 * the browser's local timezone, converted to a UTC ISO instant only at this
 * boundary — see `buildRequestLogStartDate` for why naive string
 * concatenation is wrong.
 */
export function buildRequestLogEndDate(dateInput: string): string | undefined {
  const parts = parseDateInputParts(dateInput);
  if (!parts) return undefined;

  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

export function formatRequestLogDuration(durationMs: number, locale: string): string {
  if (durationMs < 1000) {
    return `${new Intl.NumberFormat(locale).format(durationMs)} ms`;
  }

  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(durationMs / 1000)} s`;
}

export function formatRequestLogBytes(bytes: number | null, locale: string): string | null {
  if (bytes === null) {
    return null;
  }

  if (bytes < 1024) {
    return `${new Intl.NumberFormat(locale).format(bytes)} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(bytes / 1024)} KB`;
  }

  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(bytes / (1024 * 1024))} MB`;
}

export function parseRequestLogStatusCode(value: string): number | undefined {
  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return undefined;
  }

  const parsedValue = Number.parseInt(trimmedValue, 10);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}
