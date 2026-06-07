import { useState, useEffect } from 'react'
import { getAntiFraudStats, getSuspiciousBehaviors } from '../api/client'
import { formatTime } from '../hooks'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#FF6B35', '#004E89', '#10B981', '#EF4444']

interface SuspiciousItem {
  id: string
  user_id: string
  username: string
  behavior_type: string
  details: string
  risk_score: number
  detected_at: string
}

export default function AdminAntiFraud() {
  const [stats, setStats] = useState<any>(null)
  const [suspicious, setSuspicious] = useState<SuspiciousItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([getAntiFraudStats(), getSuspiciousBehaviors({ limit: 50 })])
      .then(([statsRes, suspiciousRes]) => {
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        if (suspiciousRes.status === 'fulfilled') setSuspicious(suspiciousRes.value.data?.items ?? suspiciousRes.value.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const deviceAlerts = stats?.device_fingerprint_alerts ?? 0
  const ipViolations = stats?.ip_frequency_violations ?? 0
  const behaviorAnomalies = stats?.behavior_anomalies ?? 0
  const totalFraud = deviceAlerts + ipViolations + behaviorAnomalies

  const fraudDistribution = [
    { name: '设备指纹', value: deviceAlerts },
    { name: 'IP频率异常', value: ipViolations },
    { name: '行为异常', value: behaviorAnomalies },
  ]

  const trendData = stats?.trend ?? [
    { date: '6/1', count: 5 },
    { date: '6/2', count: 8 },
    { date: '6/3', count: 3 },
    { date: '6/4', count: 12 },
    { date: '6/5', count: 7 },
    { date: '6/6', count: 9 },
    { date: '6/7', count: 4 },
  ]

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { text: '高危', class: 'badge-hot' }
    if (score >= 0.5) return { text: '中危', class: 'badge-pending' }
    return { text: '低危', class: 'badge-verified' }
  }

  const getBehaviorLabel = (type: string) => {
    const map: Record<string, string> = {
      device_forgery: '📱 设备伪造',
      ip_frequency: '🌐 IP频率异常',
      behavior_anomaly: '🤖 行为异常',
      batch_operation: '⚡ 批量操作',
      fake_location: '📍 虚假定位',
    }
    return map[type] || type
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">反欺诈监控</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{totalFraud}</p>
          <p className="text-xs text-gray-400 mt-1">总异常事件</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{deviceAlerts}</p>
          <p className="text-xs text-gray-400 mt-1">设备指纹告警</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{ipViolations}</p>
          <p className="text-xs text-gray-400 mt-1">IP频率违规</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{behaviorAnomalies}</p>
          <p className="text-xs text-gray-400 mt-1">行为异常</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">欺诈检测趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">异常类型分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={fraudDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {fraudDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {fraudDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">可疑行为列表</h3>
        {suspicious.length > 0 ? (
          <div className="space-y-3">
            {suspicious.map((item) => {
              const risk = getRiskLevel(item.risk_score)
              return (
                <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{item.username}</span>
                      <span className={risk.class}>{risk.text}</span>
                      <span className="text-xs text-gray-400">ID: {item.user_id.slice(0, 8)}...</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{getBehaviorLabel(item.behavior_type)}</p>
                    <p className="text-xs text-gray-500">{item.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(item.detected_at)}</p>
                  </div>
                  <div className="shrink-0">
                    <div className="w-14 h-14 rounded-lg bg-red-50 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-red-500">{(item.risk_score * 100).toFixed(0)}</span>
                      <span className="text-[10px] text-red-400">风险分</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🛡️</p>
            <p>暂无可疑行为</p>
          </div>
        )}
      </div>
    </div>
  )
}
