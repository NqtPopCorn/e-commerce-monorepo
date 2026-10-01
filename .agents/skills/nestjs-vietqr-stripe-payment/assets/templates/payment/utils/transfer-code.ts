import { randomBytes } from 'crypto';

/**
 * Banks uppercase the memo, drop punctuation and sometimes insert/remove spaces,
 * so the code must be plain alphanumeric. 32-char alphabet (no I, O, 0, 1) keeps
 * codes readable and makes `byte % 32` unbiased.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_BODY_LEN = 10;

export function generateTransferCode(prefix: string): string {
  const bytes = randomBytes(CODE_BODY_LEN);
  let body = '';
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  return normalizePrefix(prefix) + body;
}

/** Find a transfer code inside a raw bank memo, tolerating spaces and punctuation. */
export function extractTransferCode(memo: string, prefix: string): string | null {
  const squashed = memo.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const re = new RegExp(`${normalizePrefix(prefix)}[${ALPHABET}]{${CODE_BODY_LEN}}`);
  return squashed.match(re)?.[0] ?? null;
}

function normalizePrefix(prefix: string): string {
  const p = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!p) throw new Error('VIETQR_CODE_PREFIX must contain letters or digits');
  return p;
}
