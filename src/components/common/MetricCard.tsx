import { ReactNode, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatNumber, formatPercent } from '../../utils/format';

interface MetricCardProps {
  title: string;
  value: number | string;
  format?: 'number' | 'money' | 'percent';
  suffix?: string;
  prefix?: string;
  change?: number;
  changeLabel?: string;
  trend?: number;
  trendType?: 'up' | 'down';
  icon?: ReactNode;
  iconBg?: string;
  color?: 'brand' | 'success' | 'danger' | 'warning' | 'purple';
  showSparkline?: boolean;
  sparklineData?: number[];
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  format = 'number',
  suffix = '',
  prefix = '',
  change,
  changeLabel = '环比',
  trend,
  trendType,
  icon,
  iconBg,
  color = 'brand',
  showSparkline = false,
  sparklineData,
  className,
  onClick,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : 0;

  useEffect(() => {
    if (typeof value !== 'number') return;
    
    const duration = 1000;
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  const formatValue = (val: number) => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'money':
        return `¥${formatNumber(val)}`;
      case 'percent':
        return formatPercent(val);
      default:
        return formatNumber(val);
    }
  };

  const getChangeIcon = () => {
    const changeValue = change !== undefined ? change : trend;
    const type = trendType || (changeValue !== undefined && changeValue > 0 ? 'up' : 'down');
    
    if (changeValue === undefined && change === undefined && trend === undefined) return null;
    if (type === 'up') return <TrendingUp className="w-3.5 h-3.5" />;
    if (type === 'down') return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const getChangeColor = () => {
    const changeValue = change !== undefined ? change : trend;
    const type = trendType || (changeValue !== undefined && changeValue > 0 ? 'up' : 'down');
    
    if (changeValue === undefined && change === undefined && trend === undefined) return 'text-dark-500';
    if (color === 'success' || (type === 'up' && color !== 'danger')) return 'text-success-500';
    if (color === 'danger' || type === 'down') return 'text-danger-500';
    return 'text-dark-500';
  };

  const colorClasses = {
    brand: {
      text: 'text-brand-400',
      bg: 'bg-brand-500/20',
      glow: 'from-brand-500/5',
    },
    success: {
      text: 'text-success-400',
      bg: 'bg-success-500/20',
      glow: 'from-success-500/5',
    },
    danger: {
      text: 'text-danger-400',
      bg: 'bg-danger-500/20',
      glow: 'from-danger-500/5',
    },
    warning: {
      text: 'text-warning-400',
      bg: 'bg-warning-500/20',
      glow: 'from-warning-500/5',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/20',
      glow: 'from-purple-500/5',
    },
  };

  const displayChange = change !== undefined ? change : trend;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-dark-800/80 to-dark-900/90 border border-dark-700/50 rounded-xl p-5 transition-all duration-300',
        onClick && 'cursor-pointer hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-dark-400 font-medium">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            {prefix && <span className="text-lg text-dark-400">{prefix}</span>}
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatValue(displayValue)}
            </span>
            {suffix && <span className="text-sm text-dark-500 ml-1">{suffix}</span>}
          </div>
          {displayChange !== undefined && (
            <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', getChangeColor())}>
              {getChangeIcon()}
              <span>{displayChange > 0 ? '+' : ''}{displayChange.toFixed(1)}%</span>
              <span className="text-dark-500 ml-1">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            iconBg || colorClasses[color].bg
          )}>
            {icon}
          </div>
        )}
      </div>
      
      {showSparkline && sparklineData && sparklineData.length > 1 && (
        <div className="mt-4 h-12 -mx-5 -mb-5">
          <MiniSparkline data={sparklineData} color={colorClasses[color].text.replace('text-', '#')} />
        </div>
      )}
      
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br to-transparent rounded-full -translate-y-1/2 translate-x-1/2',
        colorClasses[color].glow
      )} />
    </div>
  );
}

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

function MiniSparkline({ data, color = '#3B82F6', height = 48 }: MiniSparklineProps) {
  if (data.length < 2) return null;
  
  const width = 200;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill="url(#sparkline-gradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
