import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ value, label, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-gradient-glass backdrop-blur-xl border border-white/5 rounded-4xl shadow-card',
        'p-6 transition-all duration-300 hover:border-white/10 hover:shadow-glow-blue hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-silver-400 font-medium">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-white font-mono tabular-nums">
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                'mt-3 inline-flex items-center gap-1 text-sm font-medium',
                trend.isPositive ? 'text-mint-400' : 'text-coral-400'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-2xl',
            'bg-gradient-to-br from-night-500/60 to-night-700/60',
            'border border-white/10',
            'text-dream-300'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
