/**
 * Password policy — the single source of truth for both sides of the wire.
 *
 * The browser uses it to drive the strength meter and to block an obviously
 * invalid submit; the server re-runs the exact same `validatePassword` before
 * writing anything. Client-side validation is a convenience, never a control:
 * anyone can POST straight to the API, so the server check is the real one.
 *
 * Keep this file dependency-free — it is imported by React components and by
 * Express request handlers alike.
 */

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Upper bound. bcrypt silently truncates input beyond 72 *bytes*, so a longer
 * passphrase would give a false sense of strength — two passwords sharing the
 * first 72 bytes hash identically. Rejecting them is clearer than truncating.
 */
export const PASSWORD_MAX_BYTES = 72;

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  { id: 'uppercase', label: 'One uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lowercase', label: 'One lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'One number (0–9)', test: (v) => /[0-9]/.test(v) },
  {
    id: 'special',
    label: 'One special character (!@#$…)',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export interface PasswordValidationResult {
  valid: boolean;
  /** Rule ids that are not yet satisfied. */
  failed: string[];
  /** First human-readable problem, suitable for an inline field error. */
  message: string | null;
}

/** Byte length, because bcrypt's 72 limit counts bytes and not code points. */
const byteLength = (value: string): number =>
  typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(value).length
    : Buffer.byteLength(value, 'utf8');

export const validatePassword = (value: string): PasswordValidationResult => {
  if (!value) {
    return { valid: false, failed: PASSWORD_RULES.map((r) => r.id), message: 'Password is required.' };
  }

  if (byteLength(value) > PASSWORD_MAX_BYTES) {
    return {
      valid: false,
      failed: ['length'],
      message: `Password must be ${PASSWORD_MAX_BYTES} bytes or fewer.`,
    };
  }

  const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
  return {
    valid: failed.length === 0,
    failed: failed.map((r) => r.id),
    message: failed.length ? failed[0].label.replace(/^At least/, 'Use at least') : null,
  };
};

/** 0–4, for the strength meter. Only ever a hint — `valid` is what gates submit. */
export const passwordScore = (value: string): number => {
  if (!value) return 0;
  const satisfied = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  // Length beyond the minimum earns the top band, so a 12-char password that
  // meets every rule reads as "strong" rather than merely "good".
  const lengthBonus = value.length >= 12 ? 1 : 0;
  return Math.min(4, Math.max(0, satisfied - 1 + lengthBonus));
};

export const PASSWORD_STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
