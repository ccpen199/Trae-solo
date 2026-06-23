import { motion } from 'framer-motion'
import { cn } from '@shared/utils'

interface StatusBadgeProps {
  status: string
  color?: 'success' | 'warning' | 'danger' | 'info' | 'muted'
  size?: 'sm' | 'md'
  pulse?: boolean
  className?: string
}

const colorMap = {
  success: 'bg-cyber-success/20 text-cyber-success border-cyber-success/50',
  warning: 'bg-cyber-warning/20 text-cyber-warning border-cyber-warning/50',
  danger: 'bg-cyber-danger/20 text-cyber-danger border-cyber-danger/50',
  info: 'bg-cyber-accent/20 text-cyber-accent border-cyber-accent/50',
  muted: 'bg-cyber-muted/20 text-cyber-muted border-cyber-muted/50',
}

export function StatusBadge({
  status,
  color = 'info',
  size = 'md',
  pulse = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-rajdhani font-medium uppercase tracking-wider',
        colorMap[color],
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}
    >
      {pulse && (
        <motion.span
          className={cn(
            'w-2 h-2 rounded-full',
            color === 'success'
              ? 'bg-cyber-success'
              : color === 'warning'
              ? 'bg-cyber-warning'
              : color === 'danger'
              ? 'bg-cyber-danger'
              : 'bg-cyber-accent'
          )}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {status}
    </span>
  )
}
