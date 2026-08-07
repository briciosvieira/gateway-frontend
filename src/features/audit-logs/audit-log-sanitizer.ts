import { MASKED_AUDIT_VALUE } from '@/features/audit-logs/audit-logs.constants';
import type { JsonValue } from '@/features/audit-logs/audit-logs.types';

const SENSITIVE_AUDIT_KEYS = new Set([
  'password',
  'passwordhash',
  'refreshtoken',
  'accesstoken',
  'apikey',
  'apikeyhash',
  'keyhash',
  'secret',
  'valueencrypted',
  'authorization',
  'cookie',
]);

function normalizeAuditKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSensitiveAuditKey(key: string): boolean {
  const normalizedKey = normalizeAuditKey(key);
  return normalizedKey.includes('password') || SENSITIVE_AUDIT_KEYS.has(normalizedKey);
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeAuditValue(value: JsonValue, key?: string): JsonValue {
  if (key && isSensitiveAuditKey(key)) {
    return MASKED_AUDIT_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item));
  }

  if (isJsonObject(value)) {
    return Object.entries(value).reduce<{ [key: string]: JsonValue }>(
      (acc, [entryKey, entryValue]) => {
        acc[entryKey] = sanitizeAuditValue(entryValue, entryKey);
        return acc;
      },
      {},
    );
  }

  return value;
}

export function sanitizeAuditJson(value: JsonValue | null): JsonValue | null {
  if (value === null) return null;
  return sanitizeAuditValue(value);
}

export function formatAuditJson(value: JsonValue | null): string {
  return JSON.stringify(sanitizeAuditJson(value), null, 2);
}
