import React from 'react';
import { cn } from '@/lib/utils';

export interface BudgetRangeProps {
  min: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const BudgetRange: React.FC<BudgetRangeProps> = ({
  min,
  max,
  size = 'md',
  className,
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const formatCurrency = (value: number): string => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(0)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold text-rose-400',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <svg
          className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {formatCurrency(min)} - {formatCurrency(max)}
    </span>
  );
};

export default BudgetRange;
