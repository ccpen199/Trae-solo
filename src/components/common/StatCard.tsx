import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { classNames } from '@/utils/formatters';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  color?: 'brand' | 'success' | 'warn' | 'danger';
  miniChart?: number[];
}

const colorMap = {
  brand: 'from-brand-50 to-white border-brand-100',
  success: 'from-emerald-50 to-white border-emerald-100',
  warn: 'from-amber-50 to-white border-amber-100',
  danger: 'from-rose-50 to-white border-rose-100',
};

const iconColorMap = {
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'brand',
  miniChart,
}: StatCardProps) {
  return (
    <div
      className={classNames(
        'card card-hover p-5 rounded-2xl border bg-gradient-to-br',
        colorMap[color]
      )}
      style={{ animation: 'staggerIn 0.5s ease-out both' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium text-slate-500 tracking-wide">{label}</div>
        {icon && (
          <div
            className={classNames(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              iconColorMap[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl lg:text-3xl font-serif font-bold text-slate-900 tracking-tight mb-2">
        {value}
      </div>
      <div className="flex items-center justify-between">
        {trend ? (
          <div className="flex items-center gap-1 text-xs">
            {trend.value > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span
              className={classNames(
                'font-semibold',
                trend.value > 0
                  ? 'text-emerald-700'
                  : trend.value < 0
                    ? 'text-rose-700'
                    : 'text-slate-500'
              )}
            >
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </span>
            {trend.label && <span className="text-slate-400">· {trend.label}</span>}
          </div>
        ) : (
          <span />
        )}
        {miniChart && miniChart.length > 0 && (
          <MiniSparkline values={miniChart} color={color} />
        )}
      </div>
    </div>
  );
}

function MiniSparkline({ values, color }: { values: number[]; color: StatCardProps['color'] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ');
  const stroke =
    color === 'success'
      ? '#10b981'
      : color === 'warn'
        ? '#f59e0b'
        : color === 'danger'
          ? '#ef4444'
          : '#0F766E';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#sg-${color})`}
        points={`0,${h} ${points} ${w},${h}`}
      />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
