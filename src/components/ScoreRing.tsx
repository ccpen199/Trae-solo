import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export default function ScoreRing({
  score,
  maxScore = 5,
  size = 180,
  strokeWidth = 14,
  label,
  sublabel,
  className,
}: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min((score / maxScore) * 100, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (score - startValue) * easeOutCubic;
      setDisplayScore(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return { from: '#FF6B35', to: '#F4511E' };
    if (score >= 4.0) return { from: '#FF8B4D', to: '#FF6B35' };
    if (score >= 3.0) return { from: '#FFAC7A', to: '#FF8B4D' };
    return { from: '#ACD4D9', to: '#6FB3BC' };
  };

  const colors = getScoreColor(score);
  const gradientId = `score-gradient-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0F7F8"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.3))' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold bg-gradient-to-br from-primary-500 to-primary-700 bg-clip-text text-transparent">
          {displayScore.toFixed(1)}
        </span>
        {label && (
          <span className="text-sm text-secondary-500 mt-1">{label}</span>
        )}
        {sublabel && (
          <span className="text-xs text-secondary-400 mt-0.5">{sublabel}</span>
        )}
      </div>

      <div
        className="absolute inset-0 rounded-full animate-breathe"
        style={{
          background: `radial-gradient(circle, ${colors.from}15 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
