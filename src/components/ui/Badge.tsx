import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const Badge = ({ variant = 'primary', size = 'md', children, className, style }: BadgeProps) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-mint-50 text-mint-600 border-mint-200',
    warning: 'bg-accent-50 text-accent-500 border-accent-200',
    danger: 'bg-red-50 text-accent-600 border-red-200',
    info: 'bg-primary-50 text-primary-400 border-primary-200',
    primary: 'bg-primary-500 text-white border-transparent',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
