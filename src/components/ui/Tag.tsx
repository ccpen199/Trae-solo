import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TagVariant = 'seal' | 'gold' | 'jade' | 'outline';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  children: ReactNode;
  icon?: ReactNode;
}

const variantStyles: Record<TagVariant, string> = {
  seal: 'bg-cinnabar-400 text-white shadow-seal',
  gold: 'bg-gold-gradient text-white shadow-gold-glow',
  jade: 'bg-jade-600 text-white',
  outline: 'border border-gold-400 text-jade-700 bg-rice-50',
};

export function Tag({ variant = 'seal', icon, className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
