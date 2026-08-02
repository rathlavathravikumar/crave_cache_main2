import React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover elevation — only for cards that are themselves clickable. */
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
} as const;

export const Card: React.FC<CardProps> = ({
  interactive = false,
  padding = 'md',
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'rounded-card border border-surface-line bg-white shadow-card',
      PADDING[padding],
      interactive &&
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-400/40 hover:shadow-raised',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

/** Section header used at the top of cards and panels. */
export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, className }) => (
  <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
    <div className="min-w-0">
      <h2 className="text-sm font-bold tracking-tight text-ink-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[13px] font-medium text-ink-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

/** Dashboard metric tile. */
export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'brand' | 'success' | 'info' | 'warning';
}> = ({ label, value, icon, hint, tone = 'brand' }) => {
  const chip = {
    brand: 'bg-brand-50 text-brand-500',
    success: 'bg-success-50 text-success-500',
    info: 'bg-info-50 text-info-500',
    warning: 'bg-warning-50 text-warning-500',
  }[tone];

  return (
    <Card padding="md" className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-ink-900">{value}</p>
        {hint && <p className="mt-1 text-[13px] font-semibold text-ink-500">{hint}</p>}
      </div>
      {icon && (
        <div
          className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-control', chip)}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
    </Card>
  );
};
