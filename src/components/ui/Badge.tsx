import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type BadgeVariant =
  | 'verified'
  | 'anonymous'
  | 'senior'
  | 'salary'
  | 'city'
  | 'status'
  | 'success'
  | 'warn'
  | 'danger'
  | 'info'
  | 'brand'
  | 'default';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'xs' | 'sm';
}

const variantStyles: Record<BadgeVariant, string> = {
  verified: 'bg-teal-50 text-teal-700 border-teal-100',
  anonymous: 'bg-ink-50 text-ink-600 border-ink-100',
  senior: 'bg-amber-50 text-amber-700 border-amber-100',
  salary: 'bg-brand-50 text-brand-700 border-brand-100',
  city: 'bg-sky-50 text-sky-700 border-sky-100',
  status: 'bg-ink-50 text-ink-600 border-ink-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warn: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-red-50 text-danger-600 border-red-100',
  info: 'bg-sky-50 text-sky-700 border-sky-100',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  default: 'bg-ink-50 text-ink-600 border-ink-100',
};

const dotColors: Record<BadgeVariant, string> = {
  verified: 'bg-teal-500',
  anonymous: 'bg-ink-400',
  senior: 'bg-amber-500',
  salary: 'bg-brand-500',
  city: 'bg-sky-500',
  status: 'bg-ink-400',
  success: 'bg-emerald-500',
  warn: 'bg-amber-500',
  danger: 'bg-danger-500',
  info: 'bg-sky-500',
  brand: 'bg-brand-500',
  default: 'bg-ink-400',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', dot = false, size = 'sm', className, children, ...props }, ref) => {
    const sizeClasses =
      size === 'xs' ? 'h-5 px-1.5 text-[10px] rounded-md' : 'h-6 px-2 text-xs rounded-lg';

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 font-medium border backdrop-blur-sm',
          sizeClasses,
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse-dot',
              dotColors[variant]
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
