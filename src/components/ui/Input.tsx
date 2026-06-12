import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string | boolean;
  label?: string;
  helperText?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      leftIcon,
      rightIcon,
      error,
      label,
      helperText,
      className,
      wrapperClassName,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const errorMsg = typeof error === 'string' ? error : '';
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink-700 ml-0.5 select-none"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'group relative flex items-center rounded-xl2 bg-white border transition-all duration-200',
            'focus-within:ring-2 focus-within:ring-offset-1',
            hasError
              ? 'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20'
              : 'border-ink-200 hover:border-ink-300 focus-within:border-brand-400 focus-within:ring-brand-400/20',
            disabled && 'bg-ink-50 cursor-not-allowed opacity-70'
          )}
        >
          {leftIcon && (
            <span
              className={cn(
                'shrink-0 pl-3.5 text-ink-400 transition-colors',
                'group-focus-within:text-brand-500',
                hasError && 'text-danger-500 group-focus-within:text-danger-500'
              )}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full h-11 px-3.5 bg-transparent text-sm text-ink-800 placeholder:text-ink-300',
              'outline-none rounded-xl2',
              'disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span
              className={cn(
                'shrink-0 pr-3.5 text-ink-400 transition-colors',
                'group-focus-within:text-brand-500',
                hasError && 'text-danger-500 group-focus-within:text-danger-500'
              )}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {(helperText || errorMsg) && (
          <p
            className={cn(
              'text-xs ml-1 transition-colors',
              hasError ? 'text-danger-500' : 'text-ink-400'
            )}
          >
            {errorMsg || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
