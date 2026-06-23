import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardVariant = 'primary' | 'accent' | 'success' | 'warning' | 'info';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: StatCardVariant;
  className?: string;
}

const variantStyles: Record<StatCardVariant, { bar: string; icon: string; iconBg: string }> = {
  primary: {
    bar: 'bg-primary-600',
    icon: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
  accent: {
    bar: 'bg-accent-500',
    icon: 'text-accent-500',
    iconBg: 'bg-accent-50',
  },
  success: {
    bar: 'bg-success',
    icon: 'text-success',
    iconBg: 'bg-green-50',
  },
  warning: {
    bar: 'bg-warning',
    icon: 'text-warning',
    iconBg: 'bg-amber-50',
  },
  info: {
    bar: 'bg-info',
    icon: 'text-info',
    iconBg: 'bg-blue-50',
  },
};

export default function StatCard({
  title,
  value,
  change,
  changeLabel = '同比',
  icon: Icon,
  variant = 'primary',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      <div className={cn('absolute top-0 left-0 w-full h-1', styles.bar)} />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-800 tracking-tight">
              {value}
            </p>
          </div>

          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              styles.iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', styles.icon)} />
          </div>
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                isPositive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              )}
            >
              {isPositive ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-xs text-gray-400">{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
