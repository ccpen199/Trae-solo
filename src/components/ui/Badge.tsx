import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-jade-100 text-jade-700',
  success: 'bg-jade-100 text-jade-700',
  warning: 'bg-gold-100 text-gold-700',
  error: 'bg-cinnabar-100 text-cinnabar-600',
  info: 'bg-porcelain-100 text-porcelain-600',
};

const dotColorMap: Record<BadgeVariant, string> = {
  default: 'bg-jade-500',
  success: 'bg-jade-500',
  warning: 'bg-gold-500',
  error: 'bg-cinnabar-500',
  info: 'bg-porcelain-500',
};

export function Badge({ variant = 'default', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColorMap[variant])} />}
      {children}
    </span>
  );
}
