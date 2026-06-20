import React from 'react';
import { cn } from '@/lib/utils';

export interface MatchScoreBarProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'from-emerald-500 to-emerald-400';
  if (score >= 70) return 'from-emerald-400 to-sapphire-400';
  if (score >= 50) return 'from-amber-500 to-amber-400';
  return 'from-red-500 to-red-400';
};

const getScoreTextColor = (score: number): string => {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-sapphire-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return '极佳匹配';
  if (score >= 75) return '高度匹配';
  if (score >= 60) return '一般匹配';
  if (score >= 40) return '较低匹配';
  return '不匹配';
};

const MatchScoreBar: React.FC<MatchScoreBarProps> = ({
  score,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || size !== 'sm') && (
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn('font-semibold', textSizeClasses[size], getScoreTextColor(clampedScore))}>
            {getScoreLabel(clampedScore)}
          </span>
          <span className={cn('font-bold', textSizeClasses[size], getScoreTextColor(clampedScore))}>
            {clampedScore}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-midnight-700/50 overflow-hidden',
          heightClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out-expo',
            getScoreColor(clampedScore)
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
};

export default MatchScoreBar;
