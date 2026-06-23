import { cn } from '../../utils'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'green' | 'yellow' | 'red'
  showLabel?: boolean
  className?: string
}

const colorMap: Record<string, string> = {
  primary: 'bg-primary-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

const sizeMap: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function Progress({ value, max = 100, size = 'md', color = 'primary', showLabel, className }: ProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('flex-1 overflow-hidden rounded-full bg-logistics-border', sizeMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all', colorMap[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-logistics-muted">{percent.toFixed(0)}%</span>}
    </div>
  )
}
