import { useEffect, useRef, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type ColorVariant = 'gov' | 'warm' | 'success' | 'danger';
type Trend = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value: number;
  change?: number;
  trend?: Trend;
  colorVariant?: ColorVariant;
  prefix?: string;
  suffix?: string;
  className?: string;
  miniChart?: React.ReactNode;
}

const variantStyles: Record<ColorVariant, {
  accent: string;
  bg: string;
  text: string;
  glow: string;
  cornerGradient: string;
}> = {
  gov: {
    accent: 'text-gov-600',
    bg: 'bg-gov-50',
    text: 'text-gov-700',
    glow: 'shadow-gov/20',
    cornerGradient: 'from-gov-500 to-gov-600',
  },
  warm: {
    accent: 'text-warm-600',
    bg: 'bg-warm-50',
    text: 'text-warm-700',
    glow: 'shadow-orange-500/20',
    cornerGradient: 'from-warm-500 to-warm-600',
  },
  success: {
    accent: 'text-success-600',
    bg: 'bg-success-50',
    text: 'text-success-700',
    glow: 'shadow-emerald-500/20',
    cornerGradient: 'from-success-500 to-success-600',
  },
  danger: {
    accent: 'text-danger-600',
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    glow: 'shadow-red-500/20',
    cornerGradient: 'from-danger-500 to-danger-600',
  },
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setValue(0);
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return value;
}

function MiniLineChart({ color, data }: { color: string; data: number[] }) {
  const width = 80;
  const height = 28;
  const padding = 2;

  const points = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d - min) / range) * (height - padding * 2);
      return { x, y };
    });
  }, [data]);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${width - padding} ${height} L ${padding} ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  change,
  trend,
  colorVariant = 'gov',
  prefix = '',
  suffix = '',
  className,
  miniChart,
}: StatCardProps) {
  const animatedValue = useCountUp(value);
  const styles = variantStyles[colorVariant];

  const computedTrend: Trend = useMemo(() => {
    if (trend) return trend;
    if (change === undefined) return 'neutral';
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }, [trend, change]);

  const defaultChartData = useMemo(() => {
    const base = value * 0.8;
    return Array.from({ length: 12 }, () => base + Math.random() * value * 0.4);
  }, [value]);

  const TrendIcon = computedTrend === 'up' ? TrendingUp : computedTrend === 'down' ? TrendingDown : Minus;
  const trendColor =
    computedTrend === 'up'
      ? 'text-success-600 bg-success-50'
      : computedTrend === 'down'
      ? 'text-danger-600 bg-danger-50'
      : 'text-slate-500 bg-slate-50';

  return (
    <div
      className={cn(
        'stat-card group',
        className
      )}
    >
      <div
        className={cn(
          'absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20',
          styles.cornerGradient
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-br opacity-[0.08] rounded-bl-full',
          styles.cornerGradient
        )}
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="stat-card-label">{label}</p>
          <div className="flex items-baseline gap-1 mt-2">
            {prefix && <span className={cn('text-lg font-semibold', styles.text)}>{prefix}</span>}
            <span
              className={cn(
                'stat-card-value tabular-nums animate-count-up',
                styles.text
              )}
            >
              {animatedValue.toLocaleString()}
            </span>
            {suffix && <span className={cn('text-base font-medium ml-0.5', styles.accent)}>{suffix}</span>}
          </div>
        </div>

        <div className={cn(styles.text, 'opacity-80')}>
          {miniChart ?? (
            <MiniLineChart color={colorVariant} data={defaultChartData} />
          )}
        </div>
      </div>

      {change !== undefined && (
        <div className="relative z-10 mt-4 flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {change > 0 ? '+' : ''}{change}{suffix || '%'}
          </span>
          <span className="text-xs text-slate-500">较昨日</span>
        </div>
      )}
    </div>
  );
}
