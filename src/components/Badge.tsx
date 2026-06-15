import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
  icon?: ReactNode;
}

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  icon,
}: BadgeProps) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-700',
    accent: 'bg-accent-100 text-accent-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    default: 'bg-zinc-100 text-zinc-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};

export default Badge;
