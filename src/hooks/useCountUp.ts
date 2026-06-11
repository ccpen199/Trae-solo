import { useEffect, useState, useRef } from 'react'

export function useCountUp(end: number, duration = 1200, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : end)
  const ref = useRef<number>(0)
  const startTime = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      setValue(end)
      return
    }
    startTime.current = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      ref.current = Math.floor(eased * end)
      setValue(ref.current)
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setValue(end)
      }
    }
    requestAnimationFrame(step)
  }, [end, duration, enabled])

  return value
}
