import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 120,
  strokeWidth = 10,
  color = 'url(#ringGradient)',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference
  const displayPercent = Math.round(Math.min(100, Math.max(0, percent)))

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A5F" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-heading font-bold bg-gradient-to-r from-space-indigo-500 via-lavender-500 to-emerald-500 bg-clip-text text-transparent">
          {displayPercent}%
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">匹配度</span>
      </div>
    </div>
  )
}

export { ProgressRing }
