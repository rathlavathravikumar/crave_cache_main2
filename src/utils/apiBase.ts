/**
 * Resolves where the API lives.
 *
 * Two deployment shapes are supported:
 *
 *   1. Single service (default) — one Express process serves both the API and
 *      the client, so relative '/api/...' paths are correct and API_BASE is ''.
 *
 *   2. Split deployment — the client is hosted separately (e.g. Vercel) and the
 *      API runs elsewhere (e.g. Render). Set VITE_API_URL to the API origin and
 *      every request is prefixed with it.
 *
 * VITE_ variables are inlined at BUILD time, so changing this requires a
 * rebuild rather than just a restart.
 */

const rawBase = import.meta.env.VITE_API_URL?.trim() || '';

/** Origin of the API, or '' when it is served from the same host. */
export const API_BASE = rawBase.replace(/\/+$/, '');

/** Turns an app-relative path into an absolute URL when a base is configured. */
export const apiUrl = (path: string): string =>
  API_BASE && path.startsWith('/') ? `${API_BASE}${path}` : path;

/**
 * Drop-in replacement for `fetch` that understands API_BASE.
 *
 * `credentials: 'include'` is set so the split deployment keeps working if
 * cookie-based sessions are added later; it is harmless same-origin.
 */
export const apiFetch = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(apiUrl(path), API_BASE ? { credentials: 'include', ...init } : init);
