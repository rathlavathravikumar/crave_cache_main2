/**
 * Single entry point for API calls.
 *
 * Replaces the ~25 near-identical try/catch + res.json() blocks scattered
 * through the pages, each of which surfaced errors differently (some showed the
 * raw message, some a generic string, some nothing at all).
 */

export class ApiError extends Error {
  status: number;
  /** True when the request never reached the server. */
  isNetworkError: boolean;

  constructor(message: string, status = 0, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/** Maps a failure to something worth showing a user. */
export const friendlyMessage = (error: unknown, fallback = 'Something went wrong.'): string => {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    if (error.status === 401 || error.status === 403) {
      return error.message || 'You are not allowed to do that.';
    }
    if (error.status === 404) {
      return error.message || 'That item no longer exists.';
    }
    if (error.status >= 500) {
      return 'The server ran into a problem. Please try again in a moment.';
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Performs a JSON request and throws ApiError on any failure.
 *
 * Server error bodies are read for an `error`/`message` field so the API's own
 * wording reaches the user instead of a bare status code.
 */
export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(headers as Record<string, string>),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    throw new ApiError(err?.message || 'Network request failed', 0, true);
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.error || payload?.message || `Request failed (${response.status})`,
      response.status
    );
  }

  return payload as T;
}

export const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  del: <T = any>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
