import React from 'react';
import { cn } from '@/lib/utils';

interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'primary' | 'gold' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

const colorClasses = {
  primary: 'from-primary-900 to-primary-700',
  gold: 'from-accent-gold-dark to-accent-gold',
  success: 'from-green-600 to-green-500',
  warning: 'from-yellow-600 to-yellow-500',
  danger: 'from-accent-red to-accent-red-light',
};

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  color = 'primary',
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'lc-card p-6 hover:-translate-y-1 cursor-pointer relative overflow-hidden',
        className
      )}
    >
      <div className={cn(
        'absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full',
        `bg-gradient-to-bl ${colorClasses[color]}`
      )} />
      
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-neutral-ink-500 font-medium">{title}</span>
        {icon && (
          <div className={cn(
            'p-2.5 rounded-lg bg-gradient-to-br text-white',
            colorClasses[color]
          )}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-3">
        <span className="text-3xl font-serif font-bold text-neutral-ink-900 animate-number-roll">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span className={cn(
            'text-xs font-medium flex items-center gap-1 mb-1',
            trend.isUp ? 'text-green-600' : 'text-accent-red'
          )}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-sm text-neutral-ink-500 mt-2">{description}</p>
      )}
    </div>
  );
};

export default DataCard;
