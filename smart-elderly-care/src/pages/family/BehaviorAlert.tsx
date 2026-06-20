import { useState, useMemo } from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { behaviorAlerts } from '../../data/mockData'
import StatCard from '../../components/StatCard'
import type { BehaviorAlert } from '../../types'

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'

const severityIcon: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="w-5 h-5 text-red-500" />,
  warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
}

const alertTypeLabel: Record<string, string> = {
  fall: '跌倒',
  wandering: '走失',
  medication_miss: '漏药',
  abnormal_vital: '体征异常',
  inactivity: '活动异常',
}

const severityLabel: Record<string, string> = {
  all: '全部',
  critical: '严重',
  warning: '警告',
  info: '提示',
}

const tabColors: Record<string, string> = {
  all: 'bg-slate-800 text-white',
  critical: 'bg-red-500 text-white',
  warning: 'bg-orange-500 text-white',
  info: 'bg-blue-500 text-white',
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function generateTrendData() {
  const days = ['6/14', '6/15', '6/16', '6/17', '6/18', '6/19', '6/20']
  return days.map((day) => ({
    day,
    count: Math.floor(Math.random() * 5) + 1,
  }))
}

interface ResolutionForm {
  alertId: string
  note: string
}

export default function BehaviorAlert() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [resolutionForm, setResolutionForm] = useState<ResolutionForm | null>(null)
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(new Set())

  const filteredAlerts = useMemo(() => {
    return behaviorAlerts
      .filter((a) => severityFilter === 'all' || a.severity === severityFilter)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [severityFilter])

  const stats = useMemo(() => {
    const today = '2026-06-20'
    const todayAlerts = behaviorAlerts.filter((a) => a.timestamp.startsWith(today))
    const unresolved = behaviorAlerts.filter((a) => !a.resolved && !resolvedAlerts.has(a.id))
    const resolved = behaviorAlerts.filter((a) => a.resolved || resolvedAlerts.has(a.id))
    const total = behaviorAlerts.length
    const rate = total > 0 ? Math.round((resolved.length / total) * 100) : 0
    return {
      todayCount: todayAlerts.length,
      unresolved: unresolved.length,
      resolved: resolved.length,
      rate,
    }
  }, [resolvedAlerts])

  const trendData = useMemo(() => generateTrendData(), [])

  const handleResolve = (alertId: string) => {
    setResolvedAlerts((prev) => new Set(prev).add(alertId))
    setResolutionForm(null)
  }

  const isAlertResolved = (alert: BehaviorAlert) => alert.resolved || resolvedAlerts.has(alert.id)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">异常行为预警中心</h2>

      <div className="grid grid-cols-4 gap-3">
        <StatCard
          title="今日预警数"
          value={stats.todayCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="未处理"
          value={stats.unresolved}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="已处理"
          value={stats.resolved}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="处理率"
          value={stats.rate}
          unit="%"
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              severityFilter === s ? tabColors[s] : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {severityLabel[s]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white rounded-xl border shadow-sm p-4 ${
              alert.severity === 'critical' ? 'border-red-200' :
              alert.severity === 'warning' ? 'border-orange-200' :
              'border-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{severityIcon[alert.severity]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-800">{alert.elderName}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    alert.severity === 'warning' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {alertTypeLabel[alert.type]}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{alert.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(alert.timestamp)}
                </div>

                {isAlertResolved(alert) ? (
                  <div className="mt-2 flex items-center gap-3 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>已处理</span>
                    {alert.resolvedBy && <span>处理人: {alert.resolvedBy}</span>}
                    {alert.resolvedAt && <span>处理时间: {formatTimestamp(alert.resolvedAt)}</span>}
                  </div>
                ) : resolutionForm?.alertId === alert.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={resolutionForm.note}
                      onChange={(e) => setResolutionForm({ ...resolutionForm, note: e.target.value })}
                      placeholder="请输入处理说明..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-elderly-300 focus:border-elderly-300"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-4 py-1.5 bg-elderly-500 text-white text-sm rounded-lg hover:bg-elderly-400 transition-colors"
                      >
                        提交
                      </button>
                      <button
                        onClick={() => setResolutionForm(null)}
                        className="px-4 py-1.5 bg-slate-100 text-slate-500 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolutionForm({ alertId: alert.id, note: '' })}
                    className="mt-2 px-3 py-1 bg-elderly-50 text-elderly-600 text-xs font-medium rounded-lg hover:bg-elderly-100 transition-colors border border-elderly-200"
                  >
                    处理
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-base font-semibold text-slate-700 mb-4">预警趋势（近7天）</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [`${value}次`, '预警次数']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#ec4899"
              strokeWidth={2.5}
              dot={{ fill: '#ec4899', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#ec4899' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
