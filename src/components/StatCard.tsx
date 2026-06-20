import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function StatCard({
  title,
  value,
  change,
  icon,
  color = 'blue',
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

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
