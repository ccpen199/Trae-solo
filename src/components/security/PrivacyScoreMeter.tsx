import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrivacyScoreMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  suggestions?: string[];
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'from-emerald-500 to-emerald-400';
  if (score >= 60) return 'from-amber-500 to-amber-400';
  if (score >= 40) return 'from-orange-500 to-orange-400';
  return 'from-red-500 to-red-400';
};

const getScoreTextColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '需改进';
};

const getScoreIcon = (score: number, className: string) => {
  if (score >= 80) return <ShieldCheck className={className} />;
  if (score >= 60) return <Shield className={className} />;
  if (score >= 40) return <ShieldAlert className={className} />;
  return <ShieldX className={className} />;
};

const PrivacyScoreMeter: React.FC<PrivacyScoreMeterProps> = ({
  score,
  size = 'md',
  showLabel = true,
  suggestions,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (clampedScore / 100) * circumference;

  const dimensions = {
    sm: { svg: 120, stroke: 6, fontSize: 'text-2xl', labelSize: 'text-xs' },
    md: { svg: 160, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-sm' },
    lg: { svg: 200, stroke: 10, fontSize: 'text-4xl', labelSize: 'text-base' },
  }[size];

  const colorClass = getScoreColor(clampedScore);
  const textColor = getScoreTextColor(clampedScore);
  const label = getScoreLabel(clampedScore);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dimensions.svg, height: dimensions.svg }}>
        <svg
          width={dimensions.svg}
          height={dimensions.svg}
          viewBox="0 0 100 100"
          className="-rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-midnight-700"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#privacyGradient)"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out-expo"
          />
          <defs>
            <linearGradient id="privacyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorClass.includes('emerald') ? '#10b981' : colorClass.includes('amber') ? '#f59e0b' : colorClass.includes('orange') ? '#f97316' : '#ef4444'} />
              <stop offset="100%" stopColor={colorClass.includes('emerald') ? '#34d399' : colorClass.includes('amber') ? '#fbbf24' : colorClass.includes('orange') ? '#fb923c' : '#f87171'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {getScoreIcon(clampedScore, cn('w-6 h-6 mb-1', textColor))}
          <span className={cn('font-bold', dimensions.fontSize, textColor)}>
            {clampedScore}
          </span>
          {showLabel && (
            <span className={cn('text-midnight-400 mt-0.5', dimensions.labelSize)}>
              {label}
            </span>
          )}
        </div>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 w-full">
          <p className="text-sm text-midnight-400 mb-2">改进建议：</p>
          <ul className="space-y-1.5">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-midnight-300">
                <span className="text-rose-400 mt-0.5">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PrivacyScoreMeter;
