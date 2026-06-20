import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  icon: React.ReactNode;
  iconGradient: string;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  progressColor?: string;
  showCircular?: boolean;
  className?: string;
}

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="animate-count-up">
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

function CircularProgress({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-midnight-700"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="url(#circleGradient)"
          strokeWidth="6"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out-expo"
        />
        <defs>
          <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e94560" />
            <stop offset="100%" stopColor="#ff6b8a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{displayValue}%</span>
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  iconGradient,
  value,
  label,
  suffix = '',
  prefix = '',
  trend,
  progress,
  progressColor = 'bg-gradient-primary',
  showCircular = false,
  className,
}: StatCardProps) {
  return (
    <Card variant="glass" className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-r', iconGradient)}>
            <span className="text-white">{icon}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-bold text-white">
              {showCircular ? null : <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />}
            </span>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full',
                  trend.isPositive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
          <p className="text-sm text-midnight-300">{label}</p>
          {progress !== undefined && !showCircular && (
            <div className="mt-3">
              <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-1000 ease-out-expo', progressColor)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {showCircular && <CircularProgress value={value} />}
      </div>
    </Card>
  );
}

export default StatCard;
