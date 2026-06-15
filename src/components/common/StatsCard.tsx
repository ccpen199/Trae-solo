import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatsCardTheme = 'blue' | 'orange' | 'green' | 'purple';

export interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  unit?: string;
  theme?: StatsCardTheme;
  className?: string;
  suffix?: string;
  prefix?: string;
}

const THEME_CONFIG: Record<StatsCardTheme, {
  bgGradient: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  accentColor: string;
}> = {
  blue: {
    bgGradient: 'from-industrial-blue-50 to-white',
    iconBg: 'bg-industrial-blue-100',
    iconColor: 'text-industrial-blue-600',
    valueColor: 'text-industrial-blue-700',
    accentColor: '#165DFF',
  },
  orange: {
    bgGradient: 'from-vital-orange-50 to-white',
    iconBg: 'bg-vital-orange-100',
    iconColor: 'text-vital-orange-600',
    valueColor: 'text-vital-orange-700',
    accentColor: '#FF7D00',
  },
  green: {
    bgGradient: 'from-success-50 to-white',
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    valueColor: 'text-success-700',
    accentColor: '#00B42A',
  },
  purple: {
    bgGradient: 'from-purple-50 to-white',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    valueColor: 'text-purple-700',
    accentColor: '#722ED1',
  },
};

const DEFAULT_ICONS: Record<StatsCardTheme, React.ReactNode> = {
  blue: <Users size={20} />,
  orange: <Briefcase size={20} />,
  green: <DollarSign size={20} />,
  purple: <BarChart3 size={20} />,
};

function useCountUp(target: number | string, duration: number = 1200): number | string {
  const [displayValue, setDisplayValue] = useState<number | string>(
    typeof target === 'number' ? 0 : target
  );

  useEffect(() => {
    if (typeof target !== 'number') {
      setDisplayValue(target);
      return;
    }

    setDisplayValue(0);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 100);

    return () => clearTimeout(timer);
  }, [target, duration]);

  return displayValue;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel = '同比',
  unit = '',
  theme = 'blue',
  className,
  suffix = '',
  prefix = '',
}: StatsCardProps) {
  const config = THEME_CONFIG[theme];
  const displayValue = useCountUp(value);
  const IconComponent = icon || DEFAULT_ICONS[theme];

  const formatValue = () => {
    if (typeof displayValue === 'number') {
      return displayValue.toLocaleString();
    }
    return displayValue;
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5',
        'bg-gradient-to-br',
        config.bgGradient,
        'border border-gray-100',
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        'animate-fade-in-up',
        className
      )}
      style={{
        animationFillMode: 'both',
      }}
    >
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
        style={{ backgroundColor: config.accentColor }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 font-medium">{title}</span>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              config.iconBg,
              config.iconColor
            )}
          >
            {IconComponent}
          </div>
        </div>

        <div className="mb-3">
          <span
            className={cn(
              'text-3xl font-bold font-mono-num',
              config.valueColor
            )}
          >
            {prefix}
            {formatValue()}
            {suffix}
          </span>
          {unit && (
            <span className="text-sm text-gray-500 ml-1 font-normal">
              {unit}
            </span>
          )}
        </div>

        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp size={14} className="text-success-500" />
            ) : (
              <TrendingDown size={14} className="text-danger-500" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                trend >= 0 ? 'text-success-600' : 'text-danger-600'
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
            <span className="text-xs text-gray-400 ml-1">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
