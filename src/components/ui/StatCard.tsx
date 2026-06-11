import React from 'react';
import { TrendingUp, TrendingDown, Minus, Circle } from 'lucide-react';
import type { TrendData, StatusVariant } from '@/types';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: TrendData;
  status?: StatusVariant;
  statusLabel?: string;
  format?: 'number' | 'currency' | 'percent' | 'time';
  loading?: boolean;
  className?: string;
}

const statusStyles: Record<StatusVariant, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  default: 'bg-gray-500',
  exception: 'bg-danger-500',
  delay: 'bg-warning-500',
  urgent: 'bg-danger-500',
};

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const trendColor = {
  up: 'text-success-400',
  down: 'text-danger-400',
  flat: 'text-gray-400',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  status,
  statusLabel,
  format = 'number',
  loading = false,
  className,
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `¥${val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'time':
        return `${val} 分钟`;
      default:
        return val.toLocaleString('zh-CN');
    }
  };

  if (loading) {
    return (
      <div className={cn(
        'bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card animate-pulse',
        className
      )}>
        <div className="h-4 bg-space-blue-600 rounded w-24 mb-3" />
        <div className="h-8 bg-space-blue-600 rounded w-32 mb-3" />
        <div className="h-3 bg-space-blue-600 rounded w-20" />
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-400 font-medium">{title}</span>
        {icon && (
          <div className="p-2 bg-space-blue-700 rounded-lg text-amber-accent-400">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className="text-3xl font-bold text-gray-100 font-mono-code">
          {formatValue(value)}
        </span>
        {status && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className={cn('w-2 h-2 rounded-full animate-status-pulse', statusStyles[status])}>
              <Circle className="w-full h-full fill-current" />
            </span>
            {statusLabel && (
              <span className="text-xs text-gray-400">{statusLabel}</span>
            )}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          {(() => {
            const Icon = trendIcon[trend.direction];
            return (
              <Icon className={cn('w-4 h-4', trendColor[trend.direction])} />
            );
          })()}
          <span className={cn('text-sm font-medium', trendColor[trend.direction])}>
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
            {trend.percentage !== undefined ? `${trend.percentage}%` : trend.value !== undefined ? trend.value : ''}
          </span>
          <span className="text-xs text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
