import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  trend?: { value: number; label: string };
  color?: string;
  dark?: boolean;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'text-primary-700',
  dark = false,
}: StatCardProps) {
  const bgColor = dark ? 'bg-slate-800' : 'bg-white';
  const textColor = dark ? 'text-white' : 'text-neutral-700';
  const subTextColor = dark ? 'text-slate-400' : 'text-neutral-500';

  return (
    <div
      className={`${bgColor} rounded-lg p-5 shadow-sm border ${
        dark ? 'border-slate-700' : 'border-neutral-200'
      } transition-shadow hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm ${subTextColor}`}>{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.value >= 0 ? (
            <TrendingUp className="w-4 h-4 text-success-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-danger-500" />
          )}
          <span
            className={`text-xs ${
              trend.value >= 0 ? 'text-success-500' : 'text-danger-500'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className={`text-xs ${subTextColor}`}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
