/**
 * CraveCache notification store.
 *
 * A tiny framework-free store so `showToast.*` stays callable from anywhere —
 * components, event handlers, and redux thunks alike — without hooks.
 * `ToastHost` subscribes to it and renders the cards.
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  /** Auto-dismiss delay in ms. 0 keeps the toast until dismissed. */
  duration: number;
}

const DEFAULT_DURATION = 3500;
const MAX_VISIBLE = 3;

let items: ToastItem[] = [];
let listeners: Array<() => void> = [];
let nextId = 1;

/** Pending auto-dismiss timers, plus what's left of them while hover-paused. */
const timers = new Map<number, { handle: ReturnType<typeof setTimeout>; expiresAt: number }>();
const paused = new Map<number, number>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const clearTimer = (id: number) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer.handle);
    timers.delete(id);
  }
  paused.delete(id);
};

const scheduleDismiss = (id: number, duration: number) => {
  clearTimer(id);
  if (duration <= 0) return;
  timers.set(id, {
    handle: setTimeout(() => dismissToast(id), duration),
    expiresAt: Date.now() + duration,
  });
};

const push = (variant: ToastVariant, message: string, duration = DEFAULT_DURATION): number => {
  // Collapse repeats: an identical message already on screen just gets its
  // timer refreshed rather than stacking a duplicate card.
  const existing = items.find((item) => item.message === message && item.variant === variant);
  if (existing) {
    scheduleDismiss(existing.id, duration);
    return existing.id;
  }

  const toast: ToastItem = { id: nextId++, variant, message, duration };
  items = [...items, toast];

  // Keep the stack shallow; oldest cards give way to the newest.
  while (items.length > MAX_VISIBLE) {
    const [oldest, ...rest] = items;
    clearTimer(oldest.id);
    items = rest;
  }

  scheduleDismiss(toast.id, duration);
  emit();
  return toast.id;
};

const update = (id: number, variant: ToastVariant, message: string, duration = DEFAULT_DURATION) => {
  if (!items.some((item) => item.id === id)) {
    push(variant, message, duration);
    return;
  }
  items = items.map((item) => (item.id === id ? { ...item, variant, message, duration } : item));
  scheduleDismiss(id, duration);
  emit();
};

export const dismissToast = (id: number) => {
  clearTimer(id);
  items = items.filter((item) => item.id !== id);
  emit();
};

/** Freeze a toast's countdown while the pointer rests on it. */
export const pauseToast = (id: number) => {
  const timer = timers.get(id);
  if (!timer) return;
  clearTimeout(timer.handle);
  timers.delete(id);
  paused.set(id, Math.max(0, timer.expiresAt - Date.now()));
};

export const resumeToast = (id: number) => {
  const remaining = paused.get(id);
  if (remaining === undefined) return;
  paused.delete(id);
  scheduleDismiss(id, remaining);
};

export const subscribeToToasts = (listener: () => void) => {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
};

export const getToasts = () => items;

export const showToast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  warning: (message: string) => push('warning', message),
  info: (message: string) => push('info', message),
  promise: async <T>(
    promise: Promise<T>,
    msgs: { pending: string; success: string; error: string }
  ): Promise<T> => {
    const id = push('loading', msgs.pending, 0);
    try {
      const result = await promise;
      update(id, 'success', msgs.success);
      return result;
    } catch (err: any) {
      update(id, 'error', err?.message || msgs.error);
      throw err;
    }
  },
};
