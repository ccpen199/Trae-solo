import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TagColor = 'westlake' | 'honghua' | 'chaojing' | 'neutral' | 'red' | 'green';
type TagSize = 'sm' | 'md';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  color?: TagColor;
  size?: TagSize;
  closable?: boolean;
  onClose?: () => void;
}

const colorClasses: Record<TagColor, string> = {
  westlake: 'bg-westlake-50 text-westlake-600',
  honghua: 'bg-honghua-50 text-honghua-600',
  chaojing: 'bg-chaojing-50 text-chaojing-700',
  neutral: 'bg-neutral-100 text-neutral-600',
  red: 'bg-red-50 text-red-600',
  green: 'bg-green-50 text-green-600',
};

const sizeClasses: Record<TagSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, color = 'neutral', size = 'md', closable = false, onClose, children, ...props }, ref) => {
    return (
      <motion.span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-pill font-medium',
          colorClasses[color],
          sizeClasses[size],
          className
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        {...props as any}
      >
        {children}
        {closable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.span>
    );
  }
);

Tag.displayName = 'Tag';

export default Tag;
