import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  colorScheme?: 'teal' | 'orange' | 'blue' | 'green';
}

const colorSchemes = {
  teal: {
    bg: 'bg-secondary-50',
    icon: 'bg-secondary-500 text-white',
    trend: 'text-secondary-600',
  },
  orange: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-500 text-white',
    trend: 'text-primary-600',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500 text-white',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-500 text-white',
    trend: 'text-green-600',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  suffix,
  colorScheme = 'teal',
}: StatCardProps) {
  const scheme = colorSchemes[colorScheme];
  const isPositive = (trend ?? 0) >= 0;

  return (
    <div className="card p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-secondary-500 font-medium">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-secondary-800">{value}</span>
            {suffix && <span className="text-sm text-secondary-500">{suffix}</span>}
          </div>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-sm', scheme.trend)}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {isPositive ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && <span className="text-secondary-500">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            scheme.icon,
            'shadow-md'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
