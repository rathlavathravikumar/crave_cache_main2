/**
 * Cryptographic primitives for passwords and reset tokens.
 *
 * Everything security-sensitive is concentrated here so it can be reviewed in
 * one place; the controllers below only orchestrate.
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { BCRYPT_ROUNDS, RESET_TOKEN_TTL_MS } from '../config/env';

/* ---------------------------------------------------------------- passwords */

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, BCRYPT_ROUNDS);

/**
 * Verifies a password against a stored hash.
 *
 * `bcrypt.compare` is constant-time with respect to the hash, and returns false
 * rather than throwing on a malformed hash, so a corrupted row can't crash the
 * login route.
 */
export const verifyPassword = async (plain: string, hash: string | null): Promise<boolean> => {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
};

/**
 * Burns roughly the same time as a real bcrypt comparison.
 *
 * Without this, "unknown email" returns in ~1ms while "wrong password" takes
 * ~250ms, and that timing difference alone tells an attacker which accounts
 * exist. Login calls this on the miss path so both branches cost the same.
 *
 * The hash below is bcrypt's own output for the string "timing" — a real hash
 * so the work factor genuinely applies, and a useless one if it ever leaks.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.6iQ0nHtL8YnBEmqBB1t3wYNqqRW8sJK';

export const burnPasswordTime = async (): Promise<void> => {
  try {
    await bcrypt.compare('timing-equalisation', DUMMY_HASH);
  } catch {
    /* ignore — this call exists only to consume time */
  }
};

/* -------------------------------------------------------------------- tokens */

export interface GeneratedResetToken {
  /** Raw token. Goes in the email link and is never persisted. */
  token: string;
  /** SHA-256 of the raw token. This is what gets stored. */
  tokenHash: string;
  /** Absolute expiry, epoch ms. */
  expiresAt: number;
}

/**
 * 32 bytes from the CSPRNG — 256 bits, far beyond brute force — rendered as
 * base64url so it survives being pasted into a URL without escaping.
 */
export const generateResetToken = (): GeneratedResetToken => {
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
  };
};

/**
 * SHA-256, deliberately not bcrypt.
 *
 * The token already has 256 bits of entropy, so it needs no key-stretching —
 * there is no "guessable" token to slow an attacker down against. Using a fast
 * digest also lets the lookup be a single indexed query by hash instead of a
 * bcrypt comparison against every outstanding token in the collection.
 */
export const hashResetToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Compares two token hashes without leaking, through timing, how many leading
 * characters matched.
 */
export const safeCompareHash = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};
