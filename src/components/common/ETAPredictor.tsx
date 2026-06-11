import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ETADeviationLevel = 'early' | 'normal' | 'warning' | 'delay';

export interface ETAPredictorProps {
  estimatedMinutes: number;
  historicalAverageMinutes: number;
  remainingMinutes?: number;
  deliveryTime?: string;
  showHistory?: boolean;
  compact?: boolean;
  className?: string;
}

export const getDeviationLevel = (estimated: number, historical: number): ETADeviationLevel => {
  const diff = estimated - historical;
  if (diff <= -2) return 'early';
  if (diff <= 3) return 'normal';
  if (diff <= 7) return 'warning';
  return 'delay';
};

export const getDeviationLabel = (level: ETADeviationLevel): string => {
  switch (level) {
    case 'early': return '提前送达';
    case 'normal': return '正常时效';
    case 'warning': return '轻微延迟';
    case 'delay': return '严重延迟';
  }
};

export const ETAPredictor: React.FC<ETAPredictorProps> = ({
  estimatedMinutes,
  historicalAverageMinutes,
  remainingMinutes,
  deliveryTime,
  showHistory = true,
  compact = false,
  className,
}) => {
  const [currentRemaining, setCurrentRemaining] = useState(remainingMinutes ?? estimatedMinutes);

  useEffect(() => {
    if (remainingMinutes !== undefined) {
      setCurrentRemaining(remainingMinutes);
      return;
    }
    const timer = setInterval(() => {
      setCurrentRemaining((prev) => Math.max(0, prev - 1));
    }, 60000);
    return () => clearInterval(timer);
  }, [remainingMinutes]);

  const deviation = estimatedMinutes - historicalAverageMinutes;
  const level = getDeviationLevel(estimatedMinutes, historicalAverageMinutes);
  const progress = estimatedMinutes > 0
    ? Math.min(100, Math.max(0, ((estimatedMinutes - currentRemaining) / estimatedMinutes) * 100))
    : 0;

  const size = compact ? 72 : 96;
  const strokeWidth = compact ? 6 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  const levelConfig: Record<ETADeviationLevel, {
    ring: string;
    text: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
  }> = {
    early: {
      ring: '#10B981',
      text: 'text-success-400',
      bg: 'bg-success-500/15',
      border: 'border-success-500/40',
      icon: <TrendingDown className="w-3.5 h-3.5" />,
    },
    normal: {
      ring: '#3B82F6',
      text: 'text-info-400',
      bg: 'bg-info-500/15',
      border: 'border-info-500/40',
      icon: <Minus className="w-3.5 h-3.5" />,
    },
    warning: {
      ring: '#F59E0B',
      text: 'text-warning-400',
      bg: 'bg-warning-500/15',
      border: 'border-warning-500/40',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    delay: {
      ring: '#EF4444',
      text: 'text-danger-400',
      bg: 'bg-danger-500/15',
      border: 'border-danger-500/40',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
  };

  const config = levelConfig[level];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1E293B"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={config.ring}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-sm font-bold font-mono-code', config.text)}>
              {currentRemaining}
            </span>
            <span className="text-[10px] text-gray-500">分钟</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
            config.bg,
            config.border,
            config.text
          )}>
            {config.icon}
            {getDeviationLabel(level)}
            {deviation !== 0 && (
              <span className="ml-0.5 font-mono-code">
                {deviation > 0 ? '+' : ''}{deviation}分
              </span>
            )}
          </div>
          {deliveryTime && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              预计 {deliveryTime} 送达
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-space-blue-700/50 border border-space-blue-600 rounded-xl p-4',
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-amber-accent-400" />
        <span className="text-sm font-semibold text-gray-100">ETA 预计送达</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <defs>
              <linearGradient id="etaRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={config.ring} stopOpacity="1" />
                <stop offset="100%" stopColor={config.ring} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1E293B"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#etaRing)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-2xl font-bold font-mono-code', config.text)}>
              {currentRemaining}
            </span>
            <span className="text-xs text-gray-500">剩余分钟</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
            config.bg,
            config.border,
            config.text
          )}>
            {config.icon}
            {getDeviationLabel(level)}
            {deviation !== 0 && (
              <span className="ml-1 font-mono-code">
                {deviation > 0 ? '+' : ''}{deviation}分钟
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">预计送达</span>
              <span className="text-gray-200 font-mono-code">{estimatedMinutes} 分钟</span>
            </div>
            {showHistory && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  历史平均
                </span>
                <span className="text-gray-400 font-mono-code">{historicalAverageMinutes} 分钟</span>
              </div>
            )}
            {deliveryTime && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">送达时间</span>
                <span className="text-amber-accent-400 font-medium">{deliveryTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="mt-4 pt-4 border-t border-space-blue-600">
          <div className="flex items-center gap-2 mb-2">
            {level === 'early' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-success-400" />
                <span className="text-xs text-success-400">
                  当前效率优于历史平均 {Math.abs(deviation)} 分钟
                </span>
              </>
            )}
            {level === 'normal' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-info-400" />
                <span className="text-xs text-info-400">
                  配送时效正常，与历史平均持平
                </span>
              </>
            )}
            {level === 'warning' && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-warning-400" />
                <span className="text-xs text-warning-400">
                  预计比历史平均慢 {deviation} 分钟，可能受路况影响
                </span>
              </>
            )}
            {level === 'delay' && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-danger-400" />
                <span className="text-xs text-danger-400">
                  严重延迟风险！比历史平均慢 {deviation} 分钟，建议关注
                </span>
              </>
            )}
          </div>

          <div className="flex gap-1">
            {[42, 38, 45, 40, 43, 39, historicalAverageMinutes].map((val, idx, arr) => {
              const maxVal = Math.max(...arr) + 5;
              const height = (val / maxVal) * 100;
              const isEstimated = idx === arr.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-12 bg-space-blue-800 rounded-sm overflow-hidden flex items-end">
                    <div
                      className={cn(
                        'w-full rounded-sm transition-all duration-300',
                        isEstimated
                          ? deviation <= 0
                            ? 'bg-success-500'
                            : deviation <= 3
                            ? 'bg-info-500'
                            : deviation <= 7
                            ? 'bg-warning-500'
                            : 'bg-danger-500'
                          : 'bg-space-blue-500'
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={cn(
                    'text-[10px] font-mono-code',
                    isEstimated ? (config.text) : 'text-gray-600'
                  )}>
                    {isEstimated ? 'ETA' : val}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5 text-center">
            近7天同区域配送历史对比（分钟）
          </p>
        </div>
      )}
    </div>
  );
};

export default ETAPredictor;
