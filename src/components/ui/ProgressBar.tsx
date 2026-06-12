import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ProgressBarColor = 'amber' | 'mint' | 'coral' | 'purple' | 'sky';

interface ProgressBarProps {
  value: number;
  label?: React.ReactNode;
  showPercentage?: boolean;
  color?: ProgressBarColor;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const colorMap: Record<ProgressBarColor, string> = {
  amber: 'bg-amber-orange',
  mint: 'bg-mood-mint',
  coral: 'bg-mood-coral',
  purple: 'bg-mood-purple',
  sky: 'bg-mood-sky',
};

const trackColorMap: Record<ProgressBarColor, string> = {
  amber: 'bg-amber-orange/20',
  mint: 'bg-mood-mint/20',
  coral: 'bg-mood-coral/20',
  purple: 'bg-mood-purple/20',
  sky: 'bg-mood-sky/20',
};

const textColorMap: Record<ProgressBarColor, string> = {
  amber: 'text-amber-orange',
  mint: 'text-mood-mint',
  coral: 'text-mood-coral',
  purple: 'text-mood-purple',
  sky: 'text-mood-sky',
};

const heightMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  label,
  showPercentage = true,
  color = 'amber',
  size = 'md',
  animated = true,
  className,
}: ProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0);

  const clampedValue = Math.min(100, Math.max(0, value));

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(clampedValue), 50);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(clampedValue);
    }
  }, [clampedValue, animated]);

  return (
    <div className={cn('w-full space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-slate-300">{label}</span>
          )}
          {showPercentage && (
            <span className={cn('font-mono font-semibold', textColorMap[color])}>
              {Math.round(displayValue)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full',
          heightMap[size],
          trackColorMap[color]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            colorMap[color]
          )}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
}
