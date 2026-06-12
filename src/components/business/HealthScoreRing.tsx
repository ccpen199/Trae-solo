import { motion } from 'framer-motion';
import { cn } from '@/utils/common';

interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function HealthScoreRing({
  score,
  size = 160,
  strokeWidth = 12,
  showLabel = true,
  className,
}: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 85) return '#2E7D5E';
    if (score >= 70) return '#8BC6A9';
    if (score >= 50) return '#FF8A4C';
    return '#EF4444';
  };

  const getStatusText = (score: number) => {
    if (score >= 85) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 50) return '一般';
    return '需关注';
  };

  const color = getColor(score);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0F0F0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-3xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        {showLabel && (
          <span className="text-xs text-neutral-500 mt-0.5">{getStatusText(score)}</span>
        )}
      </div>
    </div>
  );
}
