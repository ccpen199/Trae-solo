import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, Users, Activity, Play, Coins, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAuthStore } from '@/stores/auth'

interface RiskAlert {
  id: string
  alert_type: string
  detail: string
  risk_level: 'low' | 'medium' | 'high'
  created_at: string
  resolved: boolean
  task_title?: string
  user_nickname?: string
}

interface AdminStats {
  overview: { total_users: number; total_tasks: number }
  category_distribution: { category: string; count: number }[]
  credit_distribution: { credit_level: string; count: number }[]
  coin_circulation: { total_coins: number; avg_coins: number }
  risk_stats: { total: number; unresolved: number }
}

interface TrainResult {
  model_version: string
  metrics: { accuracy: number; precision: number; recall: number; f1_score: number }
}

const riskLevelConfig = {
  low: { label: '低', color: 'bg-emerald-primary/20 text-emerald-primary' },
  medium: { label: '中', color: 'bg-amber-primary/20 text-amber-primary' },
  high: { label: '高', color: 'bg-danger/20 text-danger' },
}

const CREDIT_COLORS: Record<string, string> = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFB800', diamond: '#00E5A0' }
const CATEGORY_LABELS: Record<string, string> = { physical: '实物交付', online: '线上代办', skill: '技能支援' }

export default function Admin() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [training, setTraining] = useState(false)
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null)
  const [params, setParams] = useState({ creditWeight: 0.5, verifyWeight: 0.3, decayFactor: 0.8 })

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setStats(json.data) })
      .catch(() => undefined)
  }, [token])

  useEffect(() => {
    fetch('/api/admin/risk-alerts?resolved=false', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setAlerts(json.data.items) })
      .catch(() => undefined)
  }, [token])

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/risk-alerts/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) setAlerts(prev => prev.filter(a => a.id !== id))
    } catch { /* resolve failed */ }
  }

  const handleTrain = async () => {
    setTraining(true)
    try {
      const res = await fetch('/api/admin/credit-model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params),
      })
      const json = await res.json()
      if (json.success) setTrainResult(json.data)
    } catch { /* resolve failed */ } finally { setTraining(false) }
  }

  const categoryData = (stats?.category_distribution ?? []).map(d => ({
    name: CATEGORY_LABELS[d.category] || d.category,
    count: d.count,
  }))

  const creditData = (stats?.credit_distribution ?? []).map(d => ({
    name: d.credit_level,
    value: d.count,
    color: CREDIT_COLORS[d.credit_level] || '#5A6B82',
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-emerald-primary" />
        <h1 className="text-2xl font-bold font-heading text-cyber-text">风控管理中心</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-dark !cursor-default text-center">
          <Activity size={18} className="text-emerald-primary mx-auto mb-1" />
          <div className="text-xl font-bold text-cyber-text font-heading">{stats?.overview.total_tasks ?? '-'}</div>
          <div className="text-xs text-cyber-dim">任务总数</div>
        </div>
        <div className="card-dark !cursor-default text-center">
          <AlertTriangle size={18} className="text-danger mx-auto mb-1" />
          <div className="text-xl font-bold text-cyber-text font-heading">{stats?.risk_stats.unresolved ?? '-'}</div>
          <div className="text-xs text-cyber-dim">风险告警</div>
        </div>
        <div className="card-dark !cursor-default text-center">
          <Users size={18} className="text-amber-primary mx-auto mb-1" />
          <div className="text-xl font-bold text-cyber-text font-heading">{stats?.overview.total_users ?? '-'}</div>
          <div className="text-xs text-cyber-dim">用户总数</div>
        </div>
        <div className="card-dark !cursor-default text-center">
          <Coins size={18} className="text-amber-primary mx-auto mb-1" />
          <div className="text-xl font-bold text-cyber-text font-heading">{stats?.coin_circulation.total_coins ?? '-'}</div>
          <div className="text-xs text-cyber-dim">助利币流通</div>
        </div>
      </div>

      <div className="card-dark !cursor-default">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-cyber-text flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger" /> 风险告警
          </h2>
          {alerts.length > 0 && <span className="badge bg-danger/20 text-danger">{alerts.length}</span>}
        </div>
        {alerts.length === 0 ? (
          <p className="text-cyber-dim text-sm text-center py-4">暂无风险告警</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map(alert => {
              const rl = riskLevelConfig[alert.risk_level] || riskLevelConfig.low
              return (
                <div key={alert.id} className="flex items-center gap-3 bg-navy-700/50 rounded-lg p-3">
                  <AlertTriangle size={16} className={alert.risk_level === 'high' ? 'text-danger' : alert.risk_level === 'medium' ? 'text-amber-primary' : 'text-emerald-primary'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cyber-text truncate">{alert.detail || alert.alert_type}</p>
                    <p className="text-xs text-cyber-dim mt-0.5">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`badge ${rl.color} flex-shrink-0`}>{rl.label}</span>
                  <button onClick={() => handleResolve(alert.id)} className="btn-secondary px-2 py-1 text-xs flex-shrink-0">处理</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card-dark !cursor-default">
        <h2 className="font-semibold text-cyber-text mb-3 flex items-center gap-2">
          <Play size={16} className="text-emerald-primary" /> 信用模型训练
        </h2>
        <div className="space-y-3">
          {[
            { label: '信用权重', key: 'creditWeight' as const, value: params.creditWeight },
            { label: '验证权重', key: 'verifyWeight' as const, value: params.verifyWeight },
            { label: '历史衰减系数', key: 'decayFactor' as const, value: params.decayFactor },
          ].map(p => (
            <div key={p.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-cyber-muted">{p.label}</span>
                <span className="text-emerald-primary">{p.value.toFixed(2)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={p.value}
                onChange={e => setParams(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-navy-600 rounded-lg appearance-none cursor-pointer accent-emerald-primary"
              />
            </div>
          ))}
          <button onClick={handleTrain} disabled={training} className="btn-primary w-full flex items-center justify-center gap-2">
            <Play size={16} /> {training ? '训练中...' : '开始训练'}
          </button>
          {trainResult && (
            <div className="bg-navy-700/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-cyber-muted">准确率</span>
                <span className="text-emerald-primary">{(trainResult.metrics.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cyber-muted">模型ID</span>
                <span className="text-cyber-text font-mono text-xs">{trainResult.model_version}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-dark !cursor-default">
        <h2 className="font-semibold text-cyber-text mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-primary" /> 数据概览
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-cyber-dim mb-2 flex items-center gap-1"><BarChart3 size={12} /> 任务分类分布</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fill: '#8B9BB4', fontSize: 12 }} axisLine={{ stroke: '#1E3352' }} />
                <YAxis tick={{ fill: '#8B9BB4', fontSize: 12 }} axisLine={{ stroke: '#1E3352' }} />
                <Tooltip contentStyle={{ background: '#0F2035', border: '1px solid #1E3352', borderRadius: 8, color: '#E8ECF1' }} />
                <Bar dataKey="count" fill="#00E5A0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-cyber-dim mb-2 flex items-center gap-1"><PieChartIcon size={12} /> 信用等级分布</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={creditData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name }) => name}>
                  {creditData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F2035', border: '1px solid #1E3352', borderRadius: 8, color: '#E8ECF1' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
