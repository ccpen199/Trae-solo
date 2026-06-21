import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline';
type TagSize = 'sm' | 'md';

interface TagProps {
  children: ReactNode;
  variant?: TagVariant;
  size?: TagSize;
  className?: string;
  icon?: ReactNode;
}

export function Tag({ children, variant = 'default', size = 'sm', className, icon }: TagProps) {
  const variants = {
    default: 'bg-dark-700/80 text-dark-300 border-dark-600/50',
    primary: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
    success: 'bg-success-500/15 text-success-500 border-success-500/30',
    warning: 'bg-warning-500/15 text-warning-500 border-warning-500/30',
    danger: 'bg-danger-500/15 text-danger-500 border-danger-500/30',
    purple: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
    outline: 'bg-transparent text-dark-400 border-dark-600/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-md border',
      variants[variant],
      sizes[size],
      className
    )}>
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </span>
  );
}
