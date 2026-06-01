import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/format';

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'slate';
  currency?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'primary',
  currency = 'CNY',
}) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600 bg-primary-50 text-primary-600',
    success: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600',
    danger: 'from-rose-500 to-rose-600 bg-rose-50 text-rose-600',
    warning: 'from-amber-500 to-amber-600 bg-amber-50 text-amber-600',
    slate: 'from-slate-500 to-slate-600 bg-slate-50 text-slate-600',
  };

  const [bgGradient, bgLight, textColor] = colorClasses[color].split(' ');

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{formatCurrency(value, currency)}</p>
          {change !== undefined && (
            <p
              className={`text-sm mt-1.5 flex items-center gap-1 ${
                change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              <span
                className={`inline-block ${
                  change >= 0 ? '' : 'rotate-180'
                }`}
              >
                ↑
              </span>
              <span>{formatPercent(Math.abs(change))}</span>
              <span className="text-slate-400 text-xs">较上月</span>
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};
