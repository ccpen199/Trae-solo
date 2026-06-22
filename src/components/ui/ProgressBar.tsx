import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

type ProgressVariant = 'primary' | 'accent' | 'success';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  variant?: ProgressVariant;
  height?: number;
  showLabel?: boolean;
}

const variantStyles: Record<ProgressVariant, string> = {
  primary: 'from-primary to-primary/70',
  accent: 'from-accent to-accent/70',
  success: 'from-success to-success/70',
};

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      variant = 'primary',
      height = 8,
      showLabel = false,
      className,
      ...props
    },
    ref,
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between mb-1.5 text-xs text-gray-500">
            <span>进度</span>
            <span className="font-medium text-gray-700">
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
        <div
          className="w-full rounded-full bg-gray-200 overflow-hidden"
          style={{ height: `${height}px` }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full bg-gradient-to-r',
              variantStyles[variant],
            )}
          />
        </div>
      </div>
    );
  },
);

ProgressBar.displayName = 'ProgressBar';
