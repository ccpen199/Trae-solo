import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressRingProps extends React.SVGAttributes<SVGSVGElement> {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  showLabel?: boolean
  labelClassName?: string
}

export const ProgressRing = React.forwardRef<SVGSVGElement, ProgressRingProps>(
  (
    {
      className,
      value,
      size = 120,
      strokeWidth = 8,
      color,
      trackColor = '#e8ddc9',
      showLabel = true,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const [animatedValue, setAnimatedValue] = React.useState(0)
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (animatedValue / 100) * circumference
    const gradientId = React.useId()

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedValue(value)
      }, 100)
      return () => clearTimeout(timer)
    }, [value])

    const strokeColor = color || `url(#${gradientId})`

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} {...props}>
          {!color && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a3a3a" />
                <stop offset="50%" stopColor="#3a7a71" />
                <stop offset="100%" stopColor="#0f2424" />
              </linearGradient>
            </defs>
          )}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        {showLabel && (
          <div className={cn('absolute inset-0 flex flex-col items-center justify-center', labelClassName)}>
            <span className="font-serif text-2xl font-bold text-jade-800">{Math.round(animatedValue)}</span>
            <span className="text-xs text-ink-500">分</span>
          </div>
        )}
      </div>
    )
  }
)
ProgressRing.displayName = 'ProgressRing'
