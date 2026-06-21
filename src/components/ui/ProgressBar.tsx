import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeStyles: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  animated = true,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label ?? `${Math.round(percentage)}%`;

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-jade-600 font-medium">{displayLabel}</span>
          <span className="text-xs text-jade-400">{value}/{max}</span>
        </div>
      )}
      <div className={cn('progress-bar', sizeStyles[size])}>
        <div
          className={cn(
            'progress-fill',
            animated && 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:animate-shimmer before:bg-[length:200%_100%]',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
