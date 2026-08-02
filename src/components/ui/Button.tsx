import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-brand hover:bg-brand-600 active:bg-brand-700 disabled:hover:bg-brand-500',
  secondary:
    'bg-ink-900 text-white hover:bg-ink-800 active:bg-black disabled:hover:bg-ink-900',
  outline:
    'bg-white text-ink-800 border border-surface-line hover:bg-surface-sunken hover:border-ink-400 disabled:hover:bg-white',
  ghost:
    'bg-transparent text-ink-600 hover:bg-surface-sunken hover:text-ink-900 disabled:hover:bg-transparent',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600 disabled:hover:bg-danger-500',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks interaction — use for in-flight requests. */
  loading?: boolean;
  /** Text shown while `loading` is true. Falls back to the normal children. */
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * The single button primitive for the app.
 *
 * `loading` both disables the control and swaps in a spinner, which is what
 * stops the double-submit problem the forms had — every call site gets that
 * behaviour for free instead of re-implementing it.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      children,
      disabled,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-control font-bold whitespace-nowrap',
          'transition-all duration-150 active:scale-[0.98]',
          'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100',
          VARIANTS[variant],
          SIZES[size],
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
