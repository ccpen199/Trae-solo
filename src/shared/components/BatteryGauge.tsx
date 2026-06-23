import { motion } from 'framer-motion'
import { cn, getSocColor, getSocBgColor } from '@shared/utils'

interface BatteryGaugeProps {
  soc: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function BatteryGauge({ soc, size = 'md', showLabel = true, className }: BatteryGaugeProps) {
  const sizeMap = {
    sm: { width: 48, height: 24, strokeWidth: 2 },
    md: { width: 80, height: 40, strokeWidth: 3 },
    lg: { width: 120, height: 60, strokeWidth: 4 },
  }

  const { width, height, strokeWidth } = sizeMap[size]
  const innerWidth = width - strokeWidth * 2 - 4
  const innerHeight = height - strokeWidth * 2
  const fillWidth = (soc / 100) * innerWidth

  const colorClass = getSocColor(soc)
  const bgClass = getSocBgColor(soc)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="relative rounded-sm border-2 border-cyber-border bg-cyber-darker"
        style={{ width, height }}
      >
        <motion.div
          className={cn('absolute left-0 top-0 bottom-0 rounded-sm', bgClass)}
          initial={{ width: 0 }}
          animate={{ width: fillWidth }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ margin: strokeWidth }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'font-mono font-bold',
              colorClass,
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'
            )}
          >
            {soc}%
          </span>
        </div>
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-1 bg-cyber-border rounded-r-sm"
          style={{ height: innerHeight * 0.5 }}
        />
      </div>
      {showLabel && size !== 'sm' && (
        <span className={cn('font-mono text-sm', colorClass)}>{soc}% SOC</span>
      )}
    </div>
  )
}
