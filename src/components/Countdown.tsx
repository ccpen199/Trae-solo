import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CountdownProps {
  seconds: number
  onExpire?: () => void
  className?: string
}

export default function Countdown({ seconds, onExpire, className }: CountdownProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.()
      return
    }
    const timer = setInterval(() => setRemaining((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [remaining, onExpire])

  const minutes = Math.floor(remaining / 60)
  const secs = remaining % 60

  const colorClass =
    remaining > 1800
      ? 'text-accent'
      : remaining > 600
        ? 'text-alert'
        : 'text-red-500'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span
        className={cn(
          'font-title text-4xl font-bold tabular-nums animate-pulse-slow',
          colorClass,
        )}
      >
        {String(minutes).padStart(2, '0')}
      </span>
      <span className={cn('font-title text-4xl font-bold animate-pulse-slow', colorClass)}>:</span>
      <span
        className={cn(
          'font-title text-4xl font-bold tabular-nums animate-pulse-slow',
          colorClass,
        )}
      >
        {String(secs).padStart(2, '0')}
      </span>
    </div>
  )
}
