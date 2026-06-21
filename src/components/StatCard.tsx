import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  suffix?: string;
  prefix?: string;
}

const colorMap = {
  blue: {
    bg: 'from-cyber-500/20 to-cyber-600/5',
    border: 'border-cyber-500/30',
    icon: 'text-cyber-400',
    iconBg: 'bg-cyber-500/20',
    text: 'text-cyber-400',
    glow: 'shadow-cyber-500/20',
  },
  green: {
    bg: 'from-neon-green/20 to-emerald-600/5',
    border: 'border-neon-green/30',
    icon: 'text-neon-green',
    iconBg: 'bg-neon-green/20',
    text: 'text-neon-green',
    glow: 'shadow-neon-green/20',
  },
  purple: {
    bg: 'from-neon-purple/20 to-purple-600/5',
    border: 'border-neon-purple/30',
    icon: 'text-neon-purple',
    iconBg: 'bg-neon-purple/20',
    text: 'text-neon-purple',
    glow: 'shadow-neon-purple/20',
  },
  orange: {
    bg: 'from-neon-orange/20 to-orange-600/5',
    border: 'border-neon-orange/30',
    icon: 'text-neon-orange',
    iconBg: 'bg-neon-orange/20',
    text: 'text-neon-orange',
    glow: 'shadow-neon-orange/20',
  },
  red: {
    bg: 'from-neon-red/20 to-red-600/5',
    border: 'border-neon-red/30',
    icon: 'text-neon-red',
    iconBg: 'bg-neon-red/20',
    text: 'text-neon-red',
    glow: 'shadow-neon-red/20',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = '较昨日',
  color = 'blue',
  suffix = '',
  prefix = '',
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'relative p-5 rounded-xl bg-gradient-to-br backdrop-blur-sm border transition-all duration-300 data-card overflow-hidden',
        colors.bg,
        colors.border,
        colors.glow
      )}
    >
      {/* 装饰光效 */}
      <div
        className={cn(
          'absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20',
          `bg-${color === 'blue' ? 'cyber-500' : color === 'green' ? 'neon-green' : color}-500`
        )}
      ></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-dark-400 text-sm font-medium mb-1">{title}</p>
            <p className="font-orbitron text-2xl font-bold text-white">
              {prefix}
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix}
            </p>
          </div>
          <div
            className={cn(
              'p-3 rounded-xl',
              colors.iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>

        {trend !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium flex items-center gap-1',
                trend >= 0 ? 'text-neon-green' : 'text-neon-red'
              )}
            >
              {trend >= 0 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {Math.abs(trend)}%
            </span>
            <span className="text-dark-500 text-sm">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
