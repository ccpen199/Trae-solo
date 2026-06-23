import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconBg = 'bg-primary/10',
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(isPositive ? 'text-green-600' : 'text-red-600')}>
                {isPositive ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-gray-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconBg)}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
