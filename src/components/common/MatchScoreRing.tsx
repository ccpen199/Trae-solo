import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type MatchScoreSize = 'sm' | 'md' | 'lg';

export interface MatchScoreRingProps {
  score: number;
  size?: MatchScoreSize;
  className?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const SIZE_CONFIG: Record<MatchScoreSize, { size: number; strokeWidth: number; fontSize: number; subFontSize: number }> = {
  sm: { size: 56, strokeWidth: 4, fontSize: 14, subFontSize: 10 },
  md: { size: 80, strokeWidth: 6, fontSize: 20, subFontSize: 11 },
  lg: { size: 120, strokeWidth: 8, fontSize: 28, subFontSize: 12 },
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#00B42A';
  if (score >= 60) return '#FF7D00';
  return '#F53F3F';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return '#E8FBF2';
  if (score >= 60) return '#FFF3E6';
  return '#FFF0F0';
};

export default function MatchScoreRing({
  score,
  size = 'md',
  className,
  showLabel = true,
  label = '匹配度',
  animated = true,
}: MatchScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const config = SIZE_CONFIG[size];
  const color = getScoreColor(score);
  const bgColor = getScoreBgColor(score);

  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (Math.min(displayScore, 100) / 100) * circumference;

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    setDisplayScore(0);
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(easeOut * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 100);

    return () => clearTimeout(timer);
  }, [score, animated]);

  return (
    <div
      className={cn('relative inline-flex flex-col items-center justify-center', className)}
      style={{ width: config.size, height: config.size }}
    >
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={config.strokeWidth}
        />
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          style={{
            transition: animated ? 'stroke-dashoffset 1.2s ease-out' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold font-mono-num"
          style={{
            fontSize: config.fontSize,
            color,
            lineHeight: 1,
          }}
        >
          {displayScore}
          <span style={{ fontSize: config.fontSize * 0.5 }}>%</span>
        </span>
        {showLabel && (
          <span
            className="text-gray-500 mt-1"
            style={{ fontSize: config.subFontSize }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
