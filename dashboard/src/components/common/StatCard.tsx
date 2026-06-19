import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  prefix?: string;
  suffix?: string;
  color?: 'blue' | 'orange' | 'green' | 'red';
}

const colorConfig = {
  blue: {
    bg: 'bg-primary-50',
    iconBg: 'bg-primary-500',
    text: 'text-primary-600',
  },
  orange: {
    bg: 'bg-accent-50',
    iconBg: 'bg-accent-500',
    text: 'text-accent-600',
  },
  green: {
    bg: 'bg-success-50',
    iconBg: 'bg-success-500',
    text: 'text-success-600',
  },
  red: {
    bg: 'bg-danger-50',
    iconBg: 'bg-danger-500',
    text: 'text-danger-600',
  },
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  prefix,
  suffix,
  color = 'blue',
}: StatCardProps) {
  const colors = colorConfig[color];

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-400 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <div className="w-6 h-6 text-white">{icon}</div>
        </div>
      </div>
    </div>
  );
}
