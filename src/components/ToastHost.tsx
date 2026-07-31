import React, { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2, X } from 'lucide-react';
import {
  ToastItem,
  ToastVariant,
  dismissToast,
  getToasts,
  pauseToast,
  resumeToast,
  subscribeToToasts,
} from '../utils/toast';

/**
 * Every variant is one uniform card — only the accent colour, icon and
 * label change — so notifications read as a single system across the app.
 */
const VARIANTS: Record<
  ToastVariant,
  { label: string; icon: any; chip: string; bar: string; spin?: boolean }
> = {
  success: {
    label: 'Success',
    icon: CheckCircle2,
    chip: 'bg-[#ECFDF5] text-[#059669]',
    bar: 'bg-[#059669]',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    chip: 'bg-rose-50 text-rose-600',
    bar: 'bg-rose-500',
  },
  warning: {
    label: 'Heads up',
    icon: AlertTriangle,
    chip: 'bg-amber-50 text-amber-600',
    bar: 'bg-amber-500',
  },
  info: {
    label: 'Info',
    icon: Info,
    chip: 'bg-[#FFF5F0] text-[#FF5200]',
    bar: 'bg-[#FF5200]',
  },
  loading: {
    label: 'Working',
    icon: Loader2,
    chip: 'bg-slate-100 text-slate-600',
    bar: 'bg-slate-400',
    spin: true,
  },
};

const ToastCard: React.FC<{ toast: ToastItem }> = ({ toast }) => {
  const variant = VARIANTS[toast.variant];
  const Icon = variant.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onMouseEnter={() => pauseToast(toast.id)}
      onMouseLeave={() => resumeToast(toast.id)}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className="toast-card pointer-events-auto relative w-full overflow-hidden rounded-card border border-surface-line bg-white shadow-overlay sm:w-[360px]"
    >
      <div className="flex items-start gap-3 p-3.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${variant.chip}`}
        >
          <Icon size={18} strokeWidth={2.5} className={variant.spin ? 'animate-spin' : ''} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {variant.label}
          </span>
          <p className="mt-0.5 text-[13px] font-bold leading-snug text-[#1F2937]">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          aria-label="Dismiss notification"
          className="-mr-0.5 -mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>

      {toast.duration > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100">
          <div
            className={`toast-progress h-full ${variant.bar}`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastHost: React.FC = () => {
  const toasts = useSyncExternalStore(subscribeToToasts, getToasts, getToasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      /*
       * Positioning rules:
       * - Desktop: top-right, offset below the sticky header via the height it
       *   publishes, so notifications never cover the nav / cart / profile.
       * - Mobile: pinned to the bottom instead, where there is no header, no
       *   form fields and no dialog controls to obscure.
       * The container is pointer-events-none so any element beneath a toast
       * stays clickable; only the cards themselves capture clicks.
       */
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col-reverse items-stretch gap-2.5 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:flex-col sm:items-end"
      style={{ top: 'var(--toast-top)' }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
