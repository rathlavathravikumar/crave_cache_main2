import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './cn';

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

const controlClasses = (hasError: boolean, hasIcon: boolean) =>
  cn(
    'w-full rounded-control border bg-white text-sm font-medium text-ink-800 transition-colors',
    'placeholder:font-normal placeholder:text-ink-400',
    'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-400',
    hasIcon ? 'pl-9 pr-3 py-2.5' : 'px-3 py-2.5',
    hasError
      ? 'border-danger-500 focus:border-danger-500'
      : 'border-surface-line hover:border-ink-400/60 focus:border-brand-500'
  );

const FieldShell: React.FC<FieldShellProps & { id: string; children: React.ReactNode }> = ({
  label,
  error,
  hint,
  required,
  className,
  id,
  children,
}) => (
  <div className={cn('space-y-1.5', className)}>
    <label htmlFor={id} className="block text-xs font-bold text-ink-800">
      {label}
      {required && (
        <span className="ml-0.5 text-danger-500" aria-hidden="true">
          *
        </span>
      )}
    </label>

    {children}

    {/* Inline validation. aria-live so screen readers announce it on change. */}
    {error ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="flex items-start gap-1 text-[11px] font-bold text-danger-600"
      >
        <AlertCircle className="mt-px h-3 w-3 shrink-0" strokeWidth={2.5} />
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${id}-hint`} className="text-[11px] font-medium text-ink-400">
          {hint}
        </p>
      )
    )}
  </div>
);

export interface InputFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>,
    FieldShellProps {
  icon?: React.ReactNode;
}

/**
 * Text input with a label, inline error and correct ARIA wiring.
 *
 * Errors are rendered rather than the value being cleared, so a failed
 * validation never discards what the user typed.
 */
export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, required, className, icon, id: providedId, ...rest }, ref) => {
    const autoId = useId();
    const id = providedId || autoId;

    return (
      <FieldShell
        id={id}
        label={label}
        error={error}
        hint={hint}
        required={required}
        className={className}
      >
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={controlClasses(Boolean(error), Boolean(icon))}
            {...rest}
          />
        </div>
      </FieldShell>
    );
  }
);
InputField.displayName = 'InputField';

export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'>,
    FieldShellProps {}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, className, id: providedId, children, ...rest }, ref) => {
    const autoId = useId();
    const id = providedId || autoId;

    return (
      <FieldShell
        id={id}
        label={label}
        error={error}
        hint={hint}
        required={required}
        className={className}
      >
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlClasses(Boolean(error), false), 'appearance-none pr-9')}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  }
);
SelectField.displayName = 'SelectField';

export interface TextAreaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>,
    FieldShellProps {}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, required, className, id: providedId, ...rest }, ref) => {
    const autoId = useId();
    const id = providedId || autoId;

    return (
      <FieldShell
        id={id}
        label={label}
        error={error}
        hint={hint}
        required={required}
        className={className}
      >
        <textarea
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlClasses(Boolean(error), false), 'min-h-20 resize-y')}
          {...rest}
        />
      </FieldShell>
    );
  }
);
TextAreaField.displayName = 'TextAreaField';
