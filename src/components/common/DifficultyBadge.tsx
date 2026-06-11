import { cn } from '@/lib/utils'
import { DIFFICULTY_CONFIG, type DifficultyLevel } from '@/types'

interface DifficultyBadgeProps {
  level: DifficultyLevel
  className?: string
}

export default function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[level]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor,
        config.borderColor,
        'border',
        className,
      )}
    >
      {config.label}
    </span>
  )
}
