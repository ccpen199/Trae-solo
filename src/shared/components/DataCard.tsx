import { motion } from 'framer-motion'
import { cn } from '@shared/utils'

interface DataCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: number
  icon?: React.ReactNode
  color?: 'cyan' | 'green' | 'orange' | 'red'
  className?: string
}

const colorMap = {
  cyan: 'from-cyber-accent/20 to-transparent text-cyber-accent border-cyber-accent/30',
  green: 'from-cyber-success/20 to-transparent text-cyber-success border-cyber-success/30',
  orange: 'from-cyber-warning/20 to-transparent text-cyber-warning border-cyber-warning/30',
  red: 'from-cyber-danger/20 to-transparent text-cyber-danger border-cyber-danger/30',
}

export function DataCard({
  title,
  value,
  unit,
  trend,
  icon,
  color = 'cyan',
  className,
}: DataCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-gradient-to-br p-4 backdrop-blur',
        colorMap[color],
        className
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-cyber-muted font-rajdhani tracking-wider uppercase">
            {title}
          </span>
          {icon && <div className="opacity-60">{icon}</div>}
        </div>
        
        <div className="flex items-baseline gap-1">
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-bold font-rajdhani"
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.span>
          {unit && <span className="text-sm opacity-70">{unit}</span>}
        </div>
        
        {trend !== undefined && (
          <div
            className={cn(
              'mt-2 text-xs font-medium flex items-center gap-1',
              trend >= 0 ? 'text-cyber-success' : 'text-cyber-danger'
            )}
          >
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}% 较昨日</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
