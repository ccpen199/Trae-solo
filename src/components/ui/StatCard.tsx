import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';
import type { StatCardProps } from '@/types';

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  trend = 'neutral',
  trendPercent,
}) => {
  const [shimmerKey, setShimmerKey] = React.useState(0);
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />,
  }[trend];

  const trendColor = {
    up: 'text-jade-400',
    down: 'text-coral-400',
    neutral: 'text-ink-400',
  }[trend];

  return (
    <Card
      className={cn(
        'p-6 hover:shadow-gold-sm hover:gold-border transition-all duration-500 group cursor-default overflow-hidden relative',
      )}
      onMouseEnter={() => {
        setShimmerKey((k) => k + 1);
      }}
    >
      <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gold-soft border border-gold-500/20 flex items-center justify-center text-gold-400">
            {icon}
          </div>
          {trendPercent && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
              trend === 'up' && 'bg-jade-500/10',
              trend === 'down' && 'bg-coral-500/10',
              trend === 'neutral' && 'bg-ink-700/50',
              trendColor,
            )}>
              {trendIcon}
              {trendPercent}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-ink-300 font-medium">{label}</p>
          <div className="relative inline-block">
            <p className="text-3xl font-bold text-ink-50 font-display tracking-tight transition-colors duration-500 group-hover:gold-text">
              {displayValue}
            </p>
            <span
              key={shimmerKey}
              className="absolute inset-0 text-3xl font-bold font-display tracking-tight opacity-0 group-hover:animate-shimmer pointer-events-none text-transparent bg-clip-text bg-gradient-to-r from-transparent via-gold-400 to-transparent bg-[length:200%_100%]"
            >
              {displayValue}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { StatCard };
