import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type StatColor = 'orange' | 'green' | 'cyan' | 'blue';

const colorMap: Record<StatColor, { bg: string; ring: string; text: string }> = {
  orange: {
    bg: 'bg-gradient-to-br from-orange-500/25 to-orange-550/10',
    ring: 'ring-orange-500/30',
    text: 'text-orange-500',
  },
  green: {
    bg: 'bg-gradient-to-br from-signal-green/25 to-signal-green/10',
    ring: 'ring-signal-green/30',
    text: 'text-signal-green',
  },
  cyan: {
    bg: 'bg-gradient-to-br from-signal-cyan/25 to-signal-cyan/10',
    ring: 'ring-signal-cyan/30',
    text: 'text-signal-cyan',
  },
  blue: {
    bg: 'bg-gradient-to-br from-signal-blue/25 to-signal-blue/10',
    ring: 'ring-signal-blue/30',
    text: 'text-signal-blue',
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: StatColor;
  unit?: string;
  prefix?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color = 'orange',
  unit,
  prefix,
}: StatCardProps) {
  const colors = colorMap[color];
  const changePositive = change !== undefined && change >= 0;

  return (
    <div className="stat-panel corner-brackets">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 shrink-0 rounded-sm ${colors.bg} ring-1 ${colors.ring} flex items-center justify-center`}
        >
          <Icon size={22} className={colors.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 font-medium tracking-wide mb-1">{label}</div>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-sm text-slate-400 font-mono">{prefix}</span>}
            <span className="font-display font-bold text-2xl text-white tracking-wide">{value}</span>
            {unit && <span className="text-xs text-slate-500 font-mono ml-0.5">{unit}</span>}
          </div>
          {change !== undefined && (
            <div
              className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${
                changePositive ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {changePositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{changePositive ? '+' : ''}{change.toFixed(1)}%</span>
              <span className="text-slate-500 font-normal">较昨日</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
