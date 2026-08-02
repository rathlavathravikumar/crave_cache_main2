import React from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Primary call to action — give the user a way out of the empty screen. */
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  /** `error` tints the icon red for failed loads rather than genuinely-empty data. */
  tone?: 'neutral' | 'error';
  className?: string;
}

/**
 * Shared empty / error placeholder.
 *
 * Every list in the app previously either rendered nothing or an unstyled
 * sentence when it had no data, which is one of the clearest "unfinished"
 * signals in a UI.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tone = 'neutral',
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-card border border-dashed px-6 py-14 text-center',
      tone === 'error' ? 'border-danger-500/30 bg-danger-50/40' : 'border-surface-line bg-white',
      className
    )}
  >
    {icon && (
      <div
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-panel',
          tone === 'error' ? 'bg-danger-50 text-danger-500' : 'bg-surface-sunken text-ink-400'
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
    )}

    <h3 className="text-base font-bold tracking-tight text-ink-900">{title}</h3>

    {description && (
      <p className="mt-1.5 max-w-sm text-[13px] font-medium leading-relaxed text-ink-500">
        {description}
      </p>
    )}

    {(action || secondaryAction) && (
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {action}
        {secondaryAction}
      </div>
    )}
  </div>
);
