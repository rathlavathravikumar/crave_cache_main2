import React, { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from './cn';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
} as const;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof SIZES;
  /**
   * Blocks Escape and backdrop clicks. Set while a request is in flight so a
   * stray click can't abandon an operation midway.
   */
  dismissible?: boolean;
  hideCloseButton?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal shell: labelled dialog, focus moved in on open, focus
 * trapped while open, focus restored to the trigger on close, background
 * scroll locked.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  hideCloseButton = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;

  const requestClose = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  // Remember the trigger so focus can go back where it came from.
  useEffect(() => {
    if (isOpen) {
      restoreFocusTo.current = document.activeElement as HTMLElement | null;
    } else {
      restoreFocusTo.current?.focus?.();
    }
  }, [isOpen]);

  // Lock background scrolling while open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Move focus into the dialog once it has mounted.
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first || panel).focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Escape to close, Tab cycles within the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusable: HTMLElement[] = Array.from<HTMLElement>(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, requestClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={requestClose}
            className="absolute inset-0 bg-ink-900/55 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className={cn(
              'relative flex w-full flex-col overflow-hidden rounded-panel bg-white shadow-overlay',
              'max-h-[calc(100vh-2rem)]',
              SIZES[size]
            )}
          >
            {(title || !hideCloseButton) && (
              <div className="flex items-start gap-4 border-b border-surface-line px-5 py-4">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="text-base font-black tracking-tight text-ink-900">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-xs font-medium leading-relaxed text-ink-500">
                      {description}
                    </p>
                  )}
                </div>

                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={requestClose}
                    disabled={!dismissible}
                    aria-label="Close dialog"
                    className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-surface-sunken hover:text-ink-800 disabled:opacity-40"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}

            {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}

            {footer && (
              <div className="flex items-center justify-end gap-2.5 border-t border-surface-line bg-surface-sunken/60 px-5 py-3.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
