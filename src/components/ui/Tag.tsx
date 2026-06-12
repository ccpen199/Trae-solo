import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TagVariant = 'brand' | 'teal' | 'ink' | 'amber' | 'sky' | 'rose';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
  size?: 'xs' | 'sm';
}

const variantStyles: Record<TagVariant, string> = {
  brand: 'bg-brand-50 text-brand-700 hover:bg-brand-100/80',
  teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100/80',
  ink: 'bg-ink-50 text-ink-600 hover:bg-ink-100/80',
  amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100/80',
  sky: 'bg-sky-50 text-sky-700 hover:bg-sky-100/80',
  rose: 'bg-rose-50 text-rose-700 hover:bg-rose-100/80',
};

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      variant = 'ink',
      removable = false,
      onRemove,
      icon,
      size = 'sm',
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const sizeClasses =
      size === 'xs' ? 'h-6 px-2 text-xs rounded-md' : 'h-7 px-2.5 text-sm rounded-lg';

    const clickable = Boolean(onClick) || removable;

    return (
      <span
        ref={ref}
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 font-medium transition-colors',
          sizeClasses,
          variantStyles[variant],
          clickable && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="ml-0.5 -mr-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors text-current/70 hover:text-current"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export default Tag;
