// Unicode "Combining Diacritical Marks" block — matches the accent marks
// left behind after `.normalize('NFD')` decomposes e.g. "ã" into "a" + "◌̃".
const COMBINING_MARKS = /[̀-ͯ]/g;
const DISALLOWED_CHARS = /[^a-z0-9\s-]/g;
const WHITESPACE = /\s+/g;
const DUPLICATE_HYPHENS = /-+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/**
 * Client-side preview only — the real `code` is generated server-side from
 * `name` and returned by the API (confirmed: `CreateClientDto`/
 * `UpdateClientDto` have no `code` field at all, it can never be set by the
 * caller). This function never runs against a request payload; it only
 * shows the user a live approximation while they type the name, before the
 * backend's authoritative value comes back in the response.
 */
export function generateIdentifier(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .trim()
    .toLowerCase()
    .replace(DISALLOWED_CHARS, '') // drop anything that isn't ASCII letters/digits/space/hyphen
    .replace(WHITESPACE, '-') // spaces -> hyphen
    .replace(DUPLICATE_HYPHENS, '-') // collapse duplicate hyphens
    .replace(EDGE_HYPHENS, ''); // trim leading/trailing hyphens
}
