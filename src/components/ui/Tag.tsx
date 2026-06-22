import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type TagVariant = 'default' | 'brand' | 'gold' | 'success' | 'warning' | 'error';
export type TagSize = 'sm' | 'md';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: TagSize;
  closable?: boolean;
  onClose?: () => void;
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant = 'default', size = 'md', closable = false, onClose, children, ...props }, ref) => {
    const variants: Record<TagVariant, string> = {
      default: 'bg-paper-200 text-paper-700',
      brand: 'bg-brand-100 text-brand-700',
      gold: 'bg-gold-100 text-gold-700',
      success: 'bg-forest-100 text-forest-700',
      warning: 'bg-gold-100 text-gold-700',
      error: 'bg-darkroom-100 text-darkroom-700',
    };

    const sizes: Record<TagSize, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-md',
          'transition-colors duration-200',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span>{children}</span>
        {closable && (
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'flex items-center justify-center rounded-sm',
              'hover:bg-black/10 transition-colors duration-200',
              'focus:outline-none focus:ring-1 focus:ring-current'
            )}
          >
            <X className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export { Tag };
