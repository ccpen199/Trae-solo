import { useEffect, useState, type ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  trend?: { value: number; direction: 'up' | 'down' };
  color?: string;
  suffix?: string;
}

export default function StatCard({ icon, label, value, trend, color = 'primary', suffix }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (typeof value === 'number' && typeof displayValue === 'number' && value !== displayValue) {
      setAnimating(true);
      const diff = value - displayValue;
      const steps = 20;
      const stepValue = diff / steps;
      let current = displayValue;
      const interval = setInterval(() => {
        current += stepValue;
        if ((stepValue > 0 && current >= value) || (stepValue < 0 && current <= value)) {
          setDisplayValue(value);
          setAnimating(false);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.round(current * 10) / 10);
        }
      }, 30);
      return () => clearInterval(interval);
    }
    setDisplayValue(value);
  }, [value]);

  const colorMap: Record<string, string> = {
    primary: 'border-l-primary text-primary',
    danger: 'border-l-danger text-danger',
    success: 'border-l-success text-success',
    warning: 'border-l-warning text-warning',
    info: 'border-l-info text-info',
  };

  const colorClass = colorMap[color] || colorMap.primary;

  return (
    <div className={`dark-card border-l-4 ${colorClass.split(' ')[0]} flex items-center gap-4`}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-surface-light ${colorClass.split(' ')[1]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className={`font-mono text-2xl font-bold ${animating ? 'animate-number' : ''} ${
            color === 'primary' ? 'text-primary' :
            color === 'danger' ? 'text-danger' :
            color === 'success' ? 'text-success' :
            color === 'warning' ? 'text-warning' :
            color === 'info' ? 'text-info' : 'text-white'
          }`}>
            {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
          </span>
          {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
          {trend && (
            <span className={`text-xs font-mono ${
              trend.direction === 'up' ? 'text-success' : 'text-danger'
            }`}>
              {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
