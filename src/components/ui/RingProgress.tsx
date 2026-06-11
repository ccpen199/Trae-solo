import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface RingProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
  animated?: boolean;
}

export function RingProgress({
  value,
  max = 100,
  size = 160,
  strokeWidth = 10,
  label,
  sublabel,
  gradientFrom = '#9B7EDB',
  gradientTo = '#7BC8A4',
  className,
  animated = true,
}: RingProgressProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(value), 50);
      return () => clearTimeout(timer);
    }
  }, [value, animated]);

  const percentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const gradientId = `ring-gradient-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ transition: 'all 0.3s ease' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animated ? 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-2xl font-semibold text-white font-mono tabular-nums">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-xs text-silver-400 mt-1 uppercase tracking-wider">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
