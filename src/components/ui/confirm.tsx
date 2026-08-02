import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` for destructive actions, `warning` for risky-but-reversible ones. */
  tone?: 'danger' | 'warning' | 'neutral';
}

interface PendingConfirm extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

/* ------------------------------------------------------------------ *
 * Store — lets `confirm()` be awaited from plain event handlers, the
 * same call shape as window.confirm but rendered as a real dialog.
 * ------------------------------------------------------------------ */

let current: PendingConfirm | null = null;
let listeners: Array<() => void> = [];
let nextId = 1;

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
};

const getSnapshot = () => current;

/**
 * Promise-based replacement for window.confirm.
 *
 *   if (!(await confirm({ title: 'Delete item?', tone: 'danger' }))) return;
 *
 * Resolves false on cancel, backdrop click or Escape.
 */
export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    // A second request supersedes an unanswered one rather than being lost.
    current?.resolve(false);
    current = { ...options, id: nextId++, resolve };
    emit();
  });

const settle = (value: boolean) => {
  current?.resolve(value);
  current = null;
  emit();
};

const TONE = {
  danger: {
    icon: Trash2,
    chip: 'bg-danger-50 text-danger-500',
    variant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    chip: 'bg-warning-50 text-warning-500',
    variant: 'primary' as const,
  },
  neutral: {
    icon: HelpCircle,
    chip: 'bg-surface-sunken text-ink-500',
    variant: 'primary' as const,
  },
};

/**
 * Mounted once near the app root. Renders whichever confirmation is pending.
 */
export const ConfirmDialogHost: React.FC = () => {
  const pending = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [busy, setBusy] = useState(false);

  // A fresh dialog always starts idle.
  useEffect(() => {
    setBusy(false);
  }, [pending?.id]);

  const tone = TONE[pending?.tone || 'danger'];
  const Icon = tone.icon;

  return (
    <Modal
      isOpen={Boolean(pending)}
      onClose={() => settle(false)}
      size="sm"
      dismissible={!busy}
      hideCloseButton
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => settle(false)} disabled={busy}>
            {pending?.cancelLabel || 'Cancel'}
          </Button>
          <Button
            variant={tone.variant}
            size="sm"
            loading={busy}
            onClick={() => {
              setBusy(true);
              settle(true);
            }}
          >
            {pending?.confirmLabel || 'Confirm'}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5 py-1">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${tone.chip}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-sm font-bold tracking-tight text-ink-900">{pending?.title}</h2>
          {pending?.description && (
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-ink-500">
              {pending.description}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
