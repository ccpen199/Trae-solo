import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GradientVariant =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan';

const gradientMap: Record<GradientVariant, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-teal-600',
  purple: 'from-violet-500 to-purple-600',
  orange: 'from-orange-500 to-amber-600',
  pink: 'from-pink-500 to-rose-600',
  cyan: 'from-cyan-500 to-sky-600',
};

const iconBgMap: Record<GradientVariant, string> = {
  blue: 'bg-blue-400/20',
  green: 'bg-emerald-400/20',
  purple: 'bg-violet-400/20',
  orange: 'bg-orange-400/20',
  pink: 'bg-pink-400/20',
  cyan: 'bg-cyan-400/20',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient?: GradientVariant;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  className?: string;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  icon,
  gradient = 'blue',
  trend,
  trendLabel,
  suffix,
  className,
  onClick,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend !== undefined && trend === 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 text-white shadow-card transition-all duration-300',
        'bg-gradient-to-br',
        gradientMap[gradient],
        onClick && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {suffix && (
              <span className="text-sm font-medium text-white/70">{suffix}</span>
            )}
          </div>

          {trend !== undefined && (
            <div className="flex items-center gap-1.5 text-sm">
              {isPositive && (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">+{trend}%</span>
                </>
              )}
              {isNegative && (
                <>
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-medium">{trend}%</span>
                </>
              )}
              {isNeutral && (
                <>
                  <Minus className="h-4 w-4" />
                  <span className="font-medium">0%</span>
                </>
              )}
              {trendLabel && (
                <span className="text-white/70">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur',
            iconBgMap[gradient]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
