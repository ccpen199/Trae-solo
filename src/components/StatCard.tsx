import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan';
  className?: string;
  compact?: boolean;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  cyan: 'bg-cyan-50 text-cyan-600',
};

export default function StatCard({
  title,
  value,
  change,
  icon,
  color = 'blue',
  className,
  compact = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  if (compact) {
    return (
      <div
        className={cn(
          'bg-white rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-shadow duration-200',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn('p-2 rounded-lg flex-shrink-0', colorMap[color])}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
            {change !== undefined && (
              <div className="mt-0.5 flex items-center gap-0.5 text-xs">
                {isPositive && <TrendingUp className="w-3 h-3 text-green-500" />}
                {isNegative && <TrendingDown className="w-3 h-3 text-red-500" />}
                {!isPositive && !isNegative && <Minus className="w-3 h-3 text-slate-400" />}
                <span
                  className={cn(
                    'font-medium',
                    isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-500'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {change}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {icon && (
          <div className={cn('p-3 rounded-lg', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          {isPositive && <TrendingUp className="w-4 h-4 text-green-500" />}
          {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
          {!isPositive && !isNegative && <Minus className="w-4 h-4 text-slate-400" />}
          <span
            className={cn(
              'font-medium',
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-500'
            )}
          >
            {isPositive ? '+' : ''}
            {change}%
          </span>
          <span className="text-slate-500">较上周</span>
        </div>
      )}
    </div>
  );
}
