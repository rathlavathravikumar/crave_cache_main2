/**
 * Typed, validated access to the environment variables this feature needs.
 *
 * Reading `process.env` inline scatters string literals and silent `undefined`s
 * across the codebase; centralising it means a misconfigured deployment is
 * reported once, clearly, at boot rather than as a confusing runtime failure
 * halfway through a password reset.
 */

const str = (key: string, fallback = ''): string => (process.env[key] ?? fallback).trim();

const int = (key: string, fallback: number): number => {
  const raw = str(key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (key: string, fallback: boolean): boolean => {
  const raw = str(key).toLowerCase();
  if (!raw) return fallback;
  return raw === 'true' || raw === '1' || raw === 'yes';
};

/* -------------------------------------------------------------- app origin */

/**
 * Public origin of the CLIENT, used to build the link inside the reset email.
 *
 * Order matters: APP_URL is the explicit override, FRONTEND_URL is reused from
 * the CORS config so the split deployment needs one variable instead of two,
 * and the localhost fallback keeps development working with no setup.
 */
export const appUrl = (): string => {
  const explicit = str('APP_URL') || str('FRONTEND_URL') || str('ALLOWED_ORIGINS').split(',')[0];
  const base = explicit.trim() || `http://localhost:${int('PORT', 3000)}`;
  return base.replace(/\/+$/, '');
};

/* ------------------------------------------------------------------- email */

export type EmailDriver = 'smtp' | 'console';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
}

export const smtpConfig = (): SmtpConfig => ({
  host: str('SMTP_HOST'),
  port: int('SMTP_PORT', 587),
  // Implicit TLS on 465; STARTTLS (secure:false, upgraded in-band) on 587.
  secure: bool('SMTP_SECURE', int('SMTP_PORT', 587) === 465),
  user: str('SMTP_USER'),
  pass: str('SMTP_PASS'),
  from: str('MAIL_FROM', 'CraveCache <no-reply@cravecache.app>'),
  replyTo: str('MAIL_REPLY_TO', str('SUPPORT_EMAIL', 'support@cravecache.app')),
});

/**
 * Which transport to use.
 *
 * Falls back to `console` when SMTP is not fully configured so a fresh clone
 * can exercise the whole flow — the reset URL is printed to the terminal
 * instead of being emailed. This is why the feature is testable with zero
 * credentials, and why it must never be the driver in production.
 */
export const emailDriver = (): EmailDriver => {
  const explicit = str('EMAIL_DRIVER').toLowerCase();
  if (explicit === 'console' || explicit === 'smtp') return explicit;
  const { host, user, pass } = smtpConfig();
  return host && user && pass ? 'smtp' : 'console';
};

export const supportEmail = (): string => str('SUPPORT_EMAIL', 'support@cravecache.app');

/* ------------------------------------------------------------------ tokens */

/** Reset-link lifetime. 15 minutes, per the brief. */
export const RESET_TOKEN_TTL_MS = int('RESET_TOKEN_TTL_MINUTES', 15) * 60 * 1000;

/** bcrypt work factor. 12 is the current sensible default for a web login. */
export const BCRYPT_ROUNDS = int('BCRYPT_ROUNDS', 12);

/* ------------------------------------------------------------- boot report */

/**
 * Logged once at startup. Surfaces a half-configured mailer immediately rather
 * than at 3am when the first user tries to reset their password.
 */
export const describeAuthConfig = (): string => {
  const driver = emailDriver();
  const parts = [
    `email=${driver}`,
    `appUrl=${appUrl()}`,
    `resetTTL=${RESET_TOKEN_TTL_MS / 60000}m`,
    `bcryptRounds=${BCRYPT_ROUNDS}`,
  ];
  if (driver === 'console') {
    parts.push('(reset links print to this console — set SMTP_* to send real mail)');
  }
  return parts.join(' ');
};
