import { useState, useEffect, useCallback } from 'react'
import { Shield, Syringe, FlaskConical, Clock, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import type { HealthCode } from '../../shared/types'

const STATUS_COLORS = {
  green: { bg: 'from-emerald-400 to-green-600', text: 'text-green-700', label: '绿码' },
  yellow: { bg: 'from-yellow-300 to-amber-500', text: 'text-yellow-700', label: '黄码' },
  red: { bg: 'from-red-400 to-red-600', text: 'text-red-700', label: '红码' },
}

const COUNTDOWN = 30

export default function HealthCodePage() {
  const [data, setData] = useState<HealthCode | null>(null)
  const [seconds, setSeconds] = useState(COUNTDOWN)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<HealthCode>('/health/code')
      setData(res.data)
      setSeconds(COUNTDOWN)
    } catch { /* ignore */ }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await api.post('/health/refresh')
      await fetchData()
    } catch { /* ignore */ }
    setRefreshing(false)
  }, [fetchData])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (seconds <= 0) { refresh(); return }
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [seconds, refresh])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-48 h-48 rounded-2xl bg-gray-200 animate-shimmer" />
      </div>
    )
  }

  const sc = STATUS_COLORS[data.status]
  const progress = (seconds / COUNTDOWN) * 100

  return (
    <div className="max-w-md mx-auto animate-fadeIn">
      <div className={`rounded-3xl bg-gradient-to-br ${sc.bg} p-8 text-white shadow-xl animate-pulse-glow`}>
        <div className="flex items-center justify-between mb-4">
          <Shield className="w-8 h-8" />
          <span className="text-sm font-medium opacity-90">{sc.label}</span>
        </div>

        <div className="text-center mb-6">
          <p className="text-lg font-semibold">张*明</p>
          <p className="text-sm opacity-80 mt-1">430100****1234</p>
        </div>

        <div className="w-48 h-48 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
          <div
            className="absolute inset-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.4) 100%)',
            }}
          />
          <div className="grid grid-cols-8 grid-rows-8 gap-[2px] w-32 h-32 relative z-10">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-[1px] ${Math.random() > 0.35 ? 'bg-white/80' : 'bg-transparent'}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span>倒计时刷新</span>
            <span>{seconds}s</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 animate-slideUp">
        <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
          <Syringe className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-dark">疫苗接种</p>
            <p className="text-xs text-text-muted truncate">
              {data.vaccine.name} · 第{data.vaccine.doses}剂 · {data.vaccine.lastDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
          <FlaskConical className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-dark">核酸检测</p>
            <p className="text-xs text-text-muted truncate">
              {data.pcr
                ? `${data.pcr.result === 'negative' ? '阴性' : '阳性'} · ${data.pcr.date} · ${data.pcr.lab}`
                : '暂无记录'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-dark">更新时间</p>
            <p className="text-xs text-text-muted">{data.updatedAt}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        {(['green', 'yellow', 'red'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-full ${
                s === 'green' ? 'bg-green-500' : s === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
              } ${data.status === s ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-40'}`}
            />
            <span className="text-xs text-text-muted">{STATUS_COLORS[s].label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={refresh}
        disabled={refreshing}
        className="flex items-center gap-2 mx-auto mt-4 text-sm text-primary hover:underline disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        手动刷新
      </button>
    </div>
  )
}
