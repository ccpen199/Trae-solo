import { useEffect, useState, useRef } from 'react'

export function CountUp({ end, duration = 1500, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const prevEnd = useRef(0)

  useEffect(() => {
    if (end === 0) {
      setCount(0)
      prevEnd.current = 0
      return
    }
    const startVal = prevEnd.current
    const startTime = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(startVal + (end - startVal) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    prevEnd.current = end
  }, [end, duration])

  return <span className="font-mono">{count.toLocaleString()}{suffix}</span>
}

export function StatCard({ label, value, suffix, icon: Icon, color = 'amber' }: {
  label: string; value: number; suffix?: string; icon: React.ElementType; color?: string
}) {
  const colorMap: Record<string, string> = {
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    ice: 'from-ice-500/20 to-ice-600/5 border-ice-500/20 text-ice-400',
    green: 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  }
  const cls = colorMap[color] || colorMap.amber

  return (
    <div className={`card-glass card-hover p-5 bg-gradient-to-br ${cls}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-steel-400 font-medium uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <div className="text-2xl font-bold text-steel-50">
        <CountUp end={value} suffix={suffix} />
      </div>
    </div>
  )
}

export function FieldBadge({ field }: { field: string }) {
  const colorMap: Record<string, string> = {
    '汽车制造': 'bg-ice-500/20 text-ice-400 border-ice-500/30',
    '零部件': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    '新能源': 'bg-green-500/20 text-green-400 border-green-500/30',
    '智能驾驶': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[field] || 'bg-steel-700 text-steel-300 border-steel-600'}`}>
      {field}
    </span>
  )
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-steel-400">{label}</span>
        <span className="font-mono text-steel-200">{score.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-steel-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${getColor(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )
}
