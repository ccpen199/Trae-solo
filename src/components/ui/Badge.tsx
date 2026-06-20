import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BadgeVariant } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-ink-700/60 text-ink-300 border border-white/[0.08]',
  success:
    'bg-jade-500/15 text-jade-400 border border-jade-500/30',
  warning:
    'bg-amberLux-500/15 text-amberLux-400 border border-amberLux-500/30',
  danger:
    'bg-coral-500/15 text-coral-400 border border-coral-500/30',
  info:
    'bg-forest-500/15 text-forest-300 border border-forest-500/30',
  gold:
    'bg-gold-500/15 text-gold-400 border border-gold-500/30',
  completed:
    'bg-jade-500/15 text-jade-400 border border-jade-500/30',
  returning:
    'bg-amberLux-500/15 text-amberLux-400 border border-amberLux-500/30',
  cancelled:
    'bg-ink-600/40 text-ink-400 border border-white/[0.06]',
  pending:
    'bg-forest-500/15 text-forest-300 border border-forest-500/30',
  paid:
    'bg-gold-500/15 text-gold-400 border border-gold-500/30',
  processing:
    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-ink-400',
  success: 'bg-jade-500',
  warning: 'bg-amberLux-500',
  danger: 'bg-coral-500',
  info: 'bg-forest-400',
  gold: 'bg-gold-500',
  completed: 'bg-jade-500',
  returning: 'bg-amberLux-500',
  cancelled: 'bg-ink-500',
  pending: 'bg-forest-400',
  paid: 'bg-gold-500',
  processing: 'bg-blue-400',
};

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'info',
  dot = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        'backdrop-blur-sm transition-all duration-200',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            dotColors[variant],
          )}
        />
      )}
      {children}
    </div>
  );
};

export { Badge };
