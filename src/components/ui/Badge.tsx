import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'brand' | 'gold' | 'success' | 'warning' | 'error';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      default: 'bg-paper-200 text-paper-700',
      brand: 'bg-brand-100 text-brand-700',
      gold: 'bg-gold-100 text-gold-700',
      success: 'bg-forest-100 text-forest-700',
      warning: 'bg-gold-100 text-gold-700',
      error: 'bg-darkroom-100 text-darkroom-700',
    };

    const sizeStyles: Record<BadgeSize, string> = {
      xs: 'px-1.5 py-0.5 text-[10px]',
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
    };

    const dotVariants: Record<BadgeVariant, string> = {
      default: 'bg-paper-500',
      brand: 'bg-brand-500',
      gold: 'bg-gold-500',
      success: 'bg-forest-500',
      warning: 'bg-gold-500',
      error: 'bg-darkroom-500',
    };

    if (dot) {
      return (
        <span
          ref={ref}
          className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-paper-600', className)}
          {...props}
        >
          <span className={cn('w-2 h-2 rounded-full', dotVariants[variant])} />
          {children}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          sizeStyles[size],
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
