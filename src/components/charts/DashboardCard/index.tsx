import React, { useState, useEffect } from 'react';
import { Card, Tooltip } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

export type TrendDirection = 'up' | 'down' | 'stable';

export interface DashboardCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  description?: string;
  colorScheme?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan';
  showAnimation?: boolean;
  animationDuration?: number;
  precision?: number;
  formatter?: (value: number) => string;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

const colorSchemes = {
  primary: {
    bg: 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10',
    text: 'text-primary-600 dark:text-primary-400',
    icon: 'bg-primary-500',
    border: 'border-primary-200 dark:border-primary-800',
  },
  success: {
    bg: 'from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-900/10',
    text: 'text-success-600 dark:text-success-400',
    icon: 'bg-success-500',
    border: 'border-success-200 dark:border-success-800',
  },
  warning: {
    bg: 'from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-900/10',
    text: 'text-warning-600 dark:text-warning-400',
    icon: 'bg-warning-500',
    border: 'border-warning-200 dark:border-warning-800',
  },
  danger: {
    bg: 'from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-900/10',
    text: 'text-danger-600 dark:text-danger-400',
    icon: 'bg-danger-500',
    border: 'border-danger-200 dark:border-danger-800',
  },
  purple: {
    bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'bg-purple-500',
    border: 'border-purple-200 dark:border-purple-800',
  },
  cyan: {
    bg: 'from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: 'bg-cyan-500',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
};

const defaultFormatter = (value: number): string => {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿';
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万';
  }
  return value.toLocaleString();
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  icon,
  trend,
  description,
  colorScheme = 'primary',
  showAnimation = true,
  animationDuration = 1500,
  precision = 0,
  formatter = defaultFormatter,
  className,
  onClick,
  loading,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  useEffect(() => {
    if (!showAnimation || loading) {
      setDisplayValue(numericValue);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;
    const endValue = numericValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / animationDuration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      setDisplayValue(Number(currentValue.toFixed(precision)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [numericValue, showAnimation, animationDuration, precision, loading]);

  const scheme = colorSchemes[colorScheme];
  const formattedValue = formatter(displayValue);

  const trendColor = trend?.direction === 'up' ? 'text-success-500' : trend?.direction === 'down' ? 'text-danger-500' : 'text-neutral-500';
  const TrendIcon = trend?.direction === 'up' ? RiseOutlined : trend?.direction === 'down' ? FallOutlined : null;

  if (loading) {
    return (
      <Card
        className={cn(
          'border rounded-lg overflow-hidden bg-gradient-to-br',
          scheme.bg,
          scheme.border,
          'animate-pulse',
          className
        )}
        bodyStyle={{ padding: '20px' }}
      >
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-4"></div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-3"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border rounded-lg overflow-hidden bg-gradient-to-br cursor-pointer transition-all duration-300 hover:shadow-cardHover',
        scheme.bg,
        scheme.border,
        className
      )}
      bodyStyle={{ padding: '20px' }}
      onClick={onClick}
      hoverable={!!onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 mb-3">
            {icon && (
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white', scheme.icon)}>
                {icon}
              </span>
            )}
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            {prefix && <span className="text-lg text-neutral-500">{prefix}</span>}
            <span className={cn('text-3xl font-bold tracking-tight', scheme.text)}>
              {formattedValue}
            </span>
            {suffix && <span className="text-sm text-neutral-500 ml-1">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1.5">
              {TrendIcon && <TrendIcon className={trendColor} />}
              <span className={cn('text-sm font-medium', trendColor)}>
                {trend.direction === 'stable' ? '' : trend.direction === 'up' ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-neutral-400 ml-1">{trend.label}</span>
              )}
            </div>
          )}
          {description && (
            <div className="text-xs text-neutral-400 mt-1">{description}</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DashboardCard;
