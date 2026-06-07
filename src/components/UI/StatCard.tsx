import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'sky' | 'emerald' | 'amber' | 'red' | 'slate';
  className?: string;
}

const colorConfig = {
  sky: {
    bg: 'bg-sky-50',
    icon: 'bg-sky-500 text-white',
    text: 'text-sky-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500 text-white',
    text: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500 text-white',
    text: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500 text-white',
    text: 'text-red-600',
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'bg-slate-500 text-white',
    text: 'text-slate-600',
  },
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'sky',
  className,
}: StatCardProps) {
  const colors = colorConfig[color];

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-slate-100 p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-sm text-slate-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colors.icon)}>{icon}</div>
      </div>
    </div>
  );
}
