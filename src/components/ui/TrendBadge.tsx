import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrendType = 'up' | 'down' | 'stable';

interface TrendBadgeProps {
  trend: TrendType;
  value?: number;
  className?: string;
}

export function TrendBadge({ trend, value, className }: TrendBadgeProps) {
  const config = {
    up: {
      icon: TrendingUp,
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
      borderClass: 'border-primary/30',
    },
    down: {
      icon: TrendingDown,
      bgClass: 'bg-danger/10',
      textClass: 'text-danger',
      borderClass: 'border-danger/30',
    },
    stable: {
      icon: Minus,
      bgClass: 'bg-slate-600/30',
      textClass: 'text-slate-400',
      borderClass: 'border-slate-600',
    },
  };

  const { icon: Icon, bgClass, textClass, borderClass } = config[trend];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        bgClass,
        textClass,
        borderClass,
        className
      )}
    >
      <Icon size={12} className={value && value > 0 ? 'animate-pulse-soft' : ''} />
      {typeof value === 'number' && value !== 0 ? (
        <span>{trend === 'up' ? '+' : ''}{value}</span>
      ) : (
        <span>{trend === 'up' ? '上升' : trend === 'down' ? '下降' : '持平'}</span>
      )}
    </span>
  );
}
