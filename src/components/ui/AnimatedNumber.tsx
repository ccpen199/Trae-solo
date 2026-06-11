import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  thousandSeparator?: boolean
  easing?: (t: number) => number
  className?: string
}

const defaultEasing = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const formatNumber = (
  num: number,
  decimals: number,
  thousandSeparator: boolean
): string => {
  const fixed = num.toFixed(decimals)
  if (!thousandSeparator) return fixed

  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export default function AnimatedNumber({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  thousandSeparator = true,
  easing = defaultEasing,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [hasAnimated])

  useEffect(() => {
    if (!hasAnimated) return

    const startValue = 0
    const endValue = value

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easing(progress)
      const currentValue = startValue + (endValue - startValue) * easedProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      startTimeRef.current = null
    }
  }, [hasAnimated, value, duration, easing])

  return (
    <span ref={ref} className={cn('inline-flex items-baseline', className)}>
      {prefix}
      <span className="tabular-nums">
        {formatNumber(displayValue, decimals, thousandSeparator)}
      </span>
      {suffix}
    </span>
  )
}
