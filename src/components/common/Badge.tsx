import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type BadgeVariant = 'westlake' | 'honghua' | 'chaojing' | 'neutral' | 'red' | 'green';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  count?: number;
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, string> = {
  westlake: 'bg-westlake-100 text-westlake-700',
  honghua: 'bg-honghua-100 text-honghua-700',
  chaojing: 'bg-chaojing-100 text-chaojing-700',
  neutral: 'bg-neutral-100 text-neutral-700',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
};

const dotVariantClasses: Record<BadgeVariant, string> = {
  westlake: 'bg-westlake-500',
  honghua: 'bg-honghua-500',
  chaojing: 'bg-chaojing-500',
  neutral: 'bg-neutral-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', dot = false, count, size = 'md', children, ...props }, ref) => {
    const displayCount = count !== undefined ? (count > 99 ? '99+' : count.toString()) : '';

    if (dot) {
      return (
        <span
          ref={ref}
          className={cn(
            'inline-block w-2.5 h-2.5 rounded-full',
            dotVariantClasses[variant],
            className
          )}
          {...props}
        />
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {count !== undefined && displayCount}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
