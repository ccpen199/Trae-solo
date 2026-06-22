import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const sizes = {
  sm: {
    input: 'h-8 px-3 text-sm',
    icon: 'px-2.5',
  },
  md: {
    input: 'h-10 px-4 text-sm',
    icon: 'px-3',
  },
  lg: {
    input: 'h-12 px-5 text-base',
    icon: 'px-4',
  },
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'md', error = false, helperText, leftIcon, rightIcon, wrapperClassName, disabled, ...props }, ref) => {
    return (
      <div className={cn('w-full', wrapperClassName)}>
        <div className={cn('relative w-full')}>
          {leftIcon && (
            <div className={cn(
              'absolute left-0 top-0 h-full flex items-center text-paper-500 pointer-events-none',
              sizes[size].icon
            )}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full rounded-md border bg-white text-paper-900 placeholder-paper-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-paper-100',
              error
                ? 'border-darkroom-500 focus:ring-darkroom-400'
                : 'border-paper-300',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              !leftIcon && sizes[size].input,
              leftIcon && sizes[size].input.replace(/px-\d+/, ''),
              sizes[size].input,
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className={cn(
              'absolute right-0 top-0 h-full flex items-center text-paper-500 pointer-events-none',
              sizes[size].icon
            )}>
              {rightIcon}
            </div>
          )}
        </div>

        {helperText && (
          <p className={cn(
            'mt-1.5 text-xs',
            error ? 'text-darkroom-600' : 'text-paper-500'
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
