import { useState } from 'react'
import { ShieldAlert, AlertTriangle, Thermometer, Unplug, WifiOff, CheckCircle, Filter } from 'lucide-react'
import { useStore } from '@/store'

const typeIcon: Record<string, typeof AlertTriangle> = {
  '过载': ShieldAlert,
  '高温': Thermometer,
  '断连': WifiOff,
  '拔枪': Unplug,
}

const typeBadge: Record<string, string> = {
  '过载': 'badge-danger',
  '高温': 'badge-warning',
  '断连': 'badge-info',
  '拔枪': 'badge-electric',
}

const severityBadge: Record<string, string> = {
  '紧急': 'badge-danger',
  '重要': 'badge-warning',
  '一般': 'badge-info',
}

const borderColors: Record<string, string> = {
  '紧急': 'border-l-alert-red',
  '重要': 'border-l-alert-orange',
  '一般': 'border-l-alert-blue',
}

export default function Alerts() {
  const { alertRecords, handleAlert } = useStore()
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const pending = alertRecords.filter((a) => a.status === '待处理').length
  const urgent = alertRecords.filter((a) => a.severity === '紧急' && a.status === '待处理').length
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayAlerts = alertRecords.filter((a) => a.triggered_at.slice(0, 10) === todayStr).length
  const resolved = alertRecords.filter((a) => a.status === '已处理').length

  const filtered = alertRecords
    .filter((a) => {
      if (typeFilter && a.alert_type !== typeFilter) return false
      if (severityFilter && a.severity !== severityFilter) return false
      if (statusFilter && a.status !== statusFilter) return false
      return true
    })
    .sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())

  const stats = [
    { label: '待处理', value: pending, color: 'text-alert-orange' },
    { label: '紧急', value: urgent, color: 'text-alert-red' },
    { label: '今日告警', value: todayAlerts, color: 'text-electric' },
    { label: '已处理', value: resolved, color: 'text-alert-green' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-electric" />
        安全与告警
      </h1>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className={`text-2xl font-din font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-28">
            <option value="">全部类型</option>
            <option value="过载">过载</option>
            <option value="高温">高温</option>
            <option value="断连">断连</option>
            <option value="拔枪">拔枪</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input-field w-28">
            <option value="">全部等级</option>
            <option value="紧急">紧急</option>
            <option value="重要">重要</option>
            <option value="一般">一般</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-28">
            <option value="">全部状态</option>
            <option value="待处理">待处理</option>
            <option value="已处理">已处理</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((a) => {
            const Icon = typeIcon[a.alert_type] || AlertTriangle
            return (
              <div
                key={a.alert_id}
                className={`border-l-4 ${borderColors[a.severity]} bg-dark-700/50 rounded-r-lg p-4 flex items-start justify-between gap-4 ${a.severity === '紧急' && a.status === '待处理' ? 'animate-pulse' : ''}`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className={typeBadge[a.alert_type]}>{a.alert_type}</span>
                    <span className={severityBadge[a.severity]}>{a.severity}</span>
                    <span className="text-xs text-electric font-mono">{a.pile_id}</span>
                  </div>
                  <p className="text-sm text-slate-300">{a.description}</p>
                  <p className="text-xs text-slate-500">触发时间: {new Date(a.triggered_at).toLocaleString('zh-CN')}</p>
                </div>
                <div className="flex-shrink-0">
                  {a.status === '待处理' ? (
                    <button onClick={() => handleAlert(a.alert_id)} className="btn-primary text-xs">
                      处理
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-alert-green text-xs">
                      <CheckCircle className="w-4 h-4" />
                      已处理
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
