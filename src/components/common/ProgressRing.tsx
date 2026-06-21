import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#0F4C81',
  trackColor = '#EBEBEE',
  label,
  showPercentage = true,
  className,
}: ProgressRingProps) {
  // 限制进度范围 0-100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // 计算圆的半径和周长
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 计算进度偏移
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // SVG 中心点
  const center = size / 2;

  // 生成渐变ID
  const gradientId = `progress-gradient-${color.replace('#', '')}`;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        <defs>
          {/* 进度条渐变 */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* 背景轨道圆 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* 进度圆弧 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s ease',
          }}
        />
      </svg>

      {/* 中心内容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span
            className="font-mono text-base font-bold tabular-nums"
            style={{ color }}
          >
            {Math.round(clampedProgress)}%
          </span>
        )}
        {label && (
          <span className="mt-0.5 text-[10px] font-medium text-ink-500">{label}</span>
        )}
      </div>
    </div>
  );
}
