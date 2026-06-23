import * as React from 'react'
import { cn } from '@/lib/utils'

export type ScoreBarColor = 'jade' | 'gold' | 'cinnabar' | 'ink'

export interface ScoreBarProps {
  label: string
  value: number
  color?: ScoreBarColor
  className?: string
  showAnimation?: boolean
}

const colorMap: Record<ScoreBarColor, string> = {
  jade: 'bg-jade-600',
  gold: 'bg-gold-500',
  cinnabar: 'bg-cinnabar-500',
  ink: 'bg-ink-700',
}

export function ScoreBar({ label, value, color = 'jade', className, showAnimation = true }: ScoreBarProps) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    if (!showAnimation) {
      setDisplayValue(value)
      return
    }
    const start = 0
    const end = value
    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(start + (end - start) * easeProgress))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(animate)
    }, 100)

    return () => clearTimeout(timer)
  }, [value, showAnimation])

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-600 font-medium">{label}</span>
        <span className="font-mono font-bold text-ink-800">{displayValue}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', colorMap[color])}
          style={{ width: `${Math.min(100, Math.max(0, displayValue))}%` }}
        />
      </div>
    </div>
  )
}

export default ScoreBar
