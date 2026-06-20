import {
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

export type TrendDirection = 'up' | 'down' | 'flat';
export type CardVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  sparklineData?: { name: string; value: number }[];
  variant?: CardVariant;
  unit?: string;
  prefix?: string;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantConfig: Record<CardVariant, {
  gradient: string;
  iconBg: string;
  iconColor: string;
  accent: string;
  chartColor: string;
}> = {
  primary: {
    gradient: 'from-primary-500/20 via-primary-500/5 to-transparent',
    iconBg: 'bg-primary-500/15',
    iconColor: 'text-primary-400',
    accent: 'from-primary-400 to-primary-600',
    chartColor: '#5889FF',
  },
  accent: {
    gradient: 'from-accent-500/20 via-accent-500/5 to-transparent',
    iconBg: 'bg-accent-500/15',
    iconColor: 'text-accent-400',
    accent: 'from-accent-400 to-accent-600',
    chartColor: '#FF8240',
  },
  success: {
    gradient: 'from-success-500/20 via-success-500/5 to-transparent',
    iconBg: 'bg-success-500/15',
    iconColor: 'text-success-400',
    accent: 'from-success-400 to-success-600',
    chartColor: '#34D399',
  },
  warning: {
    gradient: 'from-warning-500/20 via-warning-500/5 to-transparent',
    iconBg: 'bg-warning-500/15',
    iconColor: 'text-warning-400',
    accent: 'from-warning-400 to-warning-600',
    chartColor: '#FBBF24',
  },
  danger: {
    gradient: 'from-danger-500/20 via-danger-500/5 to-transparent',
    iconBg: 'bg-danger-500/15',
    iconColor: 'text-danger-400',
    accent: 'from-danger-400 to-danger-600',
    chartColor: '#F87171',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  sparklineData,
  variant = 'primary',
  unit,
  prefix,
  footer,
  className,
  onClick,
}: StatCardProps) {
  const config = variantConfig[variant];
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card p-5 relative overflow-hidden group',
        isClickable && 'cursor-pointer transition-all duration-300 hover:-translate-y-1',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none',
          config.gradient
        )}
      />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-400 font-medium mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              {prefix && (
                <span className="text-lg text-neutral-400">{prefix}</span>
              )}
              <span
                className={cn(
                  'text-3xl font-bold font-mono bg-gradient-to-br bg-clip-text text-transparent',
                  config.accent
                )}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {unit && (
                <span className="text-sm text-neutral-500 ml-1">{unit}</span>
              )}
            </div>
          </div>

          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
              config.iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', config.iconColor)} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {trend ? (
            <div className="flex items-center gap-1.5">
              {trend.direction === 'up' && (
                <TrendingUp className="w-4 h-4 text-success-400" />
              )}
              {trend.direction === 'down' && (
                <TrendingDown className="w-4 h-4 text-danger-400" />
              )}
              {trend.direction === 'flat' && (
                <div className="w-4 h-0.5 bg-neutral-500 rounded" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.direction === 'up' && 'text-success-400',
                  trend.direction === 'down' && 'text-danger-400',
                  trend.direction === 'flat' && 'text-neutral-400'
                )}
              >
                {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-xs text-neutral-500">{trend.label}</span>
              )}
            </div>
          ) : (
            <div />
          )}

          {sparklineData && sparklineData.length > 0 && (
            <div className="w-24 h-10 -mr-2 -mb-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.chartColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={config.chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F1F5F9',
                    }}
                    labelStyle={{ color: '#94A3B8', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={config.chartColor}
                    strokeWidth={2}
                    fill={`url(#gradient-${title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {footer && <div className="mt-4 pt-4 border-t border-white/5">{footer}</div>}
      </div>
    </div>
  );
}
