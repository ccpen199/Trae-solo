import React from 'react';
import { cn } from '../lib/utils';

type BadgeVariant = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-graphite-100 text-graphite-800',
    primary: 'bg-deep-blue/10 text-deep-blue',
    accent: 'bg-coral-orange/10 text-coral-orange',
    success: 'bg-emerald-500/10 text-emerald-700',
    warning: 'bg-amber-500/10 text-amber-700',
    danger: 'bg-red-500/10 text-red-700',
    info: 'bg-sky-500/10 text-sky-700',
    gold: 'bg-gold-foil/10 text-gold-foil',
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-graphite-500',
    primary: 'bg-deep-blue',
    accent: 'bg-coral-orange',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    gold: 'bg-gold-foil',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};

export { Badge };
export default Badge;
