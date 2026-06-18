import { useEffect, useState } from 'react'

interface QueryStepProps {
  onComplete: () => void
}

export default function QueryStep({ onComplete }: QueryStepProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 4
      })
    }, 60)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(onComplete, 300)
      return () => clearTimeout(timer)
    }
  }, [progress, onComplete])

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-white border border-gray-100 rounded-xl p-10">
        <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-5" />
        <p className="text-gray-700 font-medium mb-4">正在对接全国社保联网接口...</p>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">{progress}%</p>
      </div>
    </div>
  )
}
