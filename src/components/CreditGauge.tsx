import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CreditGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function CreditGauge({ score, size = 200, strokeWidth = 18 }: CreditGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const startScore = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startScore + (score - startScore) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, animatedScore));
  const progress = clampedScore / 100;
  const dashOffset = circumference * (1 - progress);

  const getGradientId = () => 'credit-gauge-gradient';

  const getScoreLabel = (s: number) => {
    if (s >= 90) return { text: '信用优秀', color: 'text-success-600', bg: 'bg-success-50' };
    if (s >= 75) return { text: '信用良好', color: 'text-brand-600', bg: 'bg-brand-50' };
    if (s >= 60) return { text: '信用一般', color: 'text-warning-600', bg: 'bg-warning-50' };
    return { text: '信用较差', color: 'text-danger-600', bg: 'bg-danger-50' };
  };

  const label = getScoreLabel(animatedScore);

  const getStrokeColor = (s: number) => {
    if (s >= 90) return '#10B981';
    if (s >= 75) return '#2A639C';
    if (s >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size * 0.75 }}>
      <svg width={size} height={size * 0.75} className="overflow-visible">
        <defs>
          <linearGradient id={getGradientId()} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FF9538" stopOpacity="0.9" />
            <stop offset="100%" stopColor={getStrokeColor(animatedScore)} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size * 0.65}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size * 0.65})`}
          style={{ clipPath: 'inset(0 0 50% 0)' }}
        />

        <circle
          cx={size / 2}
          cy={size * 0.65}
          r={radius}
          fill="none"
          stroke={`url(#${getGradientId()})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size * 0.65})`}
          style={{ clipPath: 'inset(0 0 50% 0)', transition: 'stroke-dashoffset 0.1s ease-out' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: size * 0.1 }}>
        <div className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">
          {animatedScore}
        </div>
        <div className={cn(
          'mt-1.5 px-3 py-0.5 rounded-full text-xs font-medium',
          label.bg,
          label.color
        )}>
          {label.text}
        </div>
      </div>
    </div>
  );
}
