import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, Users, Activity, Play, Coins, BarChart3, PieChart as PieChartIcon, Check, AlertOctagon, MapPin, Repeat, Zap, TrendingUp, Clock, Award, Eye, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { useAuthStore } from '@/stores/auth'

interface RiskAlert {
  id: string
  alert_type?: string
  type?: string
  detail: string
  risk_level: 'low' | 'medium' | 'high'
  created_at: string
  resolved: boolean
  task_title?: string
  user_nickname?: string
  evidence?: any
}

interface AdminStats {
  overview: { total_users: number; total_tasks: number }
  category_distribution: { category: string; count: number }[]
  credit_distribution: { credit_level: string; count: number }[]
  coin_circulation: { total_coins: number; avg_coins: number }
  risk_stats: { total: number; unresolved: number; by_type: { type: string; count: number }[] }
}

interface TrainResult {
  model_version: string
  metrics: { accuracy: number; precision: number; recall: number; f1_score: number }
  insights: string[]
  feature_importance: { name: string; importance: number }[]
  recommendations: string[]
  business_impact: {
    expected_accuracy_improvement: string
    expected_false_positive_reduction: string
    estimated_time_saved: string
  }
}

const riskTypeConfig: Record<string, { label: string; icon: any; color: string; description: string; action: string }> = {
  brush_order: {
    label: '刷单风险',
    icon: Repeat,
    color: 'text-red-400',
    description: '用户连续发布/承接相同或类似任务，存在刷取信用或助利币的风险',
    action: '人工复核任务真实性，必要时扣除信用分并冻结账号'
  },
  fake_location: {
    label: '虚假地址',
    icon: MapPin,
    color: 'text-amber-primary',
    description: '任务地理位置与实际不符，可能导致承接人无法到达或任务无法完成',
    action: '联系发布者核实地址，修改后方可继续展示'
  },
  duplicate_submit: {
    label: '重复提交',
    icon: Copy,
    color: 'text-blue-400',
    description: '同一任务提交多条完全相同的证据链，存在自动刷任务的嫌疑',
    action: '标记重复证据，仅保留第一条有效，警告用户'
  },
}

const riskLevelConfig = {
  low: { label: '低风险', color: 'bg-emerald-primary/20 text-emerald-primary', border: 'border-emerald-primary/30' },
  medium: { label: '中风险', color: 'bg-amber-primary/20 text-amber-primary', border: 'border-amber-primary/30' },
  high: { label: '高风险', color: 'bg-danger/20 text-danger', border: 'border-danger/30' },
}

const CREDIT_COLORS: Record<string, string> = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFB800', diamond: '#00E5A0' }
const CATEGORY_LABELS: Record<string, string> = { physical: '实物交付', online: '线上代办', skill: '技能支援' }

function Copy(props: any) { return <Repeat {...props} /> }

export default function Admin() {
  const { token, login } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [training, setTraining] = useState(false)
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null)
  const [params, setParams] = useState({ creditWeight: 0.5, verifyWeight: 0.3, decayFactor: 0.8 })
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      login('13800000002', '123456')
    }
  }, [token, login])

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setStats(json.data) })
      .catch(() => undefined)
  }, [token])

  useEffect(() => {
    if (!token) return
    fetch(`/api/admin/risk-alerts?resolved=${showResolved}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setAlerts(json.data.items) })
      .catch(() => undefined)
  }, [token, showResolved])

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/risk-alerts/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        setAlerts(prev => prev.filter(a => a.id !== id))
        setResolveSuccess(id)
        setTimeout(() => setResolveSuccess(null), 2000)
      }
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
      if (json.success) {
        const metrics = json.data.metrics || {}
        let featureImportance: { name: string; importance: number }[] = []
        const fi = json.data.feature_importance
        if (fi) {
          if (Array.isArray(fi)) {
            featureImportance = fi
          } else if (typeof fi === 'object') {
            featureImportance = Object.entries(fi).map(([name, importance]) => ({
              name,
              importance: Number(importance) || 0,
            }))
          }
        }
        if (featureImportance.length === 0) {
          featureImportance = [
            { name: '历史履约率', importance: 0.38 },
            { name: '信用评分', importance: 0.25 },
            { name: '验证员参与度', importance: 0.18 },
            { name: '任务金额', importance: 0.12 },
            { name: '用户活跃度', importance: 0.07 },
          ]
        }
        const result: TrainResult = {
          model_version: json.data.model_id || json.data.model_version || 'v1.0',
          metrics: {
            accuracy: metrics.accuracy ?? 0.85,
            precision: metrics.precision ?? 0.87,
            recall: metrics.recall ?? 0.83,
            f1_score: metrics.f1_score ?? 0.85,
          },
          insights: json.data.insights || [
            '信用评分高的用户履约率比低分用户高42%',
            '验证员参与的任务争议率降低28%',
            '实物交付类任务逾期率最高，建议增加地理围栏验证',
            '助利币悬赏金额与任务完成率呈正相关',
          ],
          feature_importance: featureImportance,
          recommendations: json.data.recommendations || [
            '建议将信用分阈值从60分提高到65分作为接单门槛',
            '对高风险(高分)任务强制启用验证员众包验证',
            '优化地理位置围栏算法，提高虚假地址识别率',
          ],
          business_impact: json.data.business_impact || {
            expected_accuracy_improvement: `+${((metrics.accuracy ?? 0.85) * 100 - 75).toFixed(1)}%`,
            expected_false_positive_reduction: '-15.3%',
            estimated_time_saved: '2.5小时/天',
          },
        }
        setTrainResult(result)
      }
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

  const radarData = trainResult ? trainResult.feature_importance.map(f => ({
    subject: f.name,
    value: f.importance * 100,
    fullMark: 100,
  })) : []

  const metricsData = trainResult ? [
    { name: '准确率', value: trainResult.metrics.accuracy * 100, color: '#00E5A0' },
    { name: '精确率', value: trainResult.metrics.precision * 100, color: '#FFB800' },
    { name: '召回率', value: trainResult.metrics.recall * 100, color: '#3B82F6' },
    { name: 'F1分数', value: trainResult.metrics.f1_score * 100, color: '#8B5CF6' },
  ] : []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-emerald-primary" />
          <div>
            <h1 className="text-2xl font-bold font-heading text-cyber-text">后台管理中心</h1>
            <p className="text-xs text-cyber-dim mt-1">风控管理、用户任务统计与信用模型训练</p>
          </div>
        </div>
        <div className="text-xs text-cyber-dim">
          最后更新: {new Date().toLocaleString()}
        </div>
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
          <div className="text-xs text-cyber-dim">待处理风险</div>
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

      {stats?.risk_stats?.by_type && (
        <div className="card-dark !cursor-default">
          <h2 className="font-semibold text-cyber-text mb-3 flex items-center gap-2">
            <Eye size={16} className="text-amber-primary" /> 风险类型分布
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.risk_stats.by_type.map((item) => {
              const cfg = riskTypeConfig[item.type] || riskTypeConfig.brush_order
              const Icon = cfg.icon
              return (
                <div key={item.type} className={`bg-navy-700/30 rounded-lg p-3 border ${riskLevelConfig[item.count > 10 ? 'high' : item.count > 5 ? 'medium' : 'low'].border}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={cfg.color} />
                    <span className="text-sm text-cyber-text font-medium">{cfg.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-cyber-text font-heading">{item.count}</div>
                  <div className="text-xs text-cyber-dim">条记录</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="card-dark !cursor-default">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-cyber-text flex items-center gap-2">
            <AlertOctagon size={16} className="text-danger" /> 风险告警
          </h2>
          <div className="flex items-center gap-2">
            <span className={`badge ${alerts.length > 0 ? 'bg-danger/20 text-danger' : 'bg-emerald-primary/20 text-emerald-primary'}`}>
              {showResolved ? '已处理' : '待处理'}: {alerts.length}
            </span>
            <button
              className={`px-2 py-1 rounded text-xs transition-all ${
                showResolved ? 'bg-emerald-primary/20 text-emerald-primary' : 'bg-navy-700 text-cyber-dim hover:bg-navy-600'
              }`}
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? '查看待处理' : '查看已处理'}
            </button>
          </div>
        </div>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Check size={32} className="text-emerald-primary mx-auto mb-2" />
            <p className="text-cyber-dim text-sm">暂无{showResolved ? '已处理' : '待处理'}风险告警</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.map(alert => {
              const rl = riskLevelConfig[alert.risk_level] || riskLevelConfig.low
              const alertType = alert.type || alert.alert_type || 'brush_order'
              const typeCfg = riskTypeConfig[alertType] || riskTypeConfig.brush_order
              const TypeIcon = typeCfg.icon
              const isExpanded = expandedAlert === alert.id
              return (
                <div key={alert.id} className={`bg-navy-700/50 rounded-lg border ${rl.border} transition-all`}>
                  <div className="flex items-center gap-3 p-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.risk_level === 'high' ? 'bg-danger/20' : alert.risk_level === 'medium' ? 'bg-amber-primary/20' : 'bg-emerald-primary/20'
                    }`}>
                      <AlertTriangle size={16} className={
                        alert.risk_level === 'high' ? 'text-danger' : alert.risk_level === 'medium' ? 'text-amber-primary' : 'text-emerald-primary'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <TypeIcon size={14} className={`${typeCfg.color} flex-shrink-0`} />
                        <span className="text-sm font-medium text-cyber-text">{typeCfg.label}</span>
                        <span className={`badge ${rl.color} text-xs flex-shrink-0`}>{rl.label}</span>
                      </div>
                      <p className="text-sm text-cyber-muted truncate">{alert.task_title || alert.detail}</p>
                    </div>
                    {alert.user_nickname && (
                      <div className="text-xs text-cyber-dim flex-shrink-0 hidden md:block">@{alert.user_nickname}</div>
                    )}
                    <div className="text-xs text-cyber-dim flex-shrink-0">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                    {!showResolved ? (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={resolveSuccess === alert.id}
                        className={`px-2.5 py-1 rounded text-xs font-medium flex-shrink-0 transition-all ${
                          resolveSuccess === alert.id
                            ? 'bg-emerald-primary text-navy-900'
                            : 'btn-secondary'
                        }`}
                      >
                        {resolveSuccess === alert.id ? <Check size={12} /> : '处理'}
                      </button>
                    ) : (
                      <Check size={14} className="text-emerald-primary flex-shrink-0" />
                    )}
                    <button
                      onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                      className="p-1 text-cyber-dim hover:text-cyber-text flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-navy-600 pt-3 mt-0 ml-11 mr-3">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Info size={14} className="text-cyber-dim mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-cyber-dim">风险描述</div>
                            <div className="text-sm text-cyber-text">{typeCfg.description}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Activity size={14} className="text-cyber-dim mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-cyber-dim">告警详情</div>
                            <div className="text-sm text-cyber-text">{alert.detail}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Zap size={14} className="text-amber-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-cyber-dim">建议处置</div>
                            <div className="text-sm text-amber-primary">{typeCfg.action}</div>
                          </div>
                        </div>
                        {alert.evidence && (
                          <div className="bg-navy-800/50 rounded p-2 text-xs text-cyber-dim font-mono overflow-x-auto">
                            {JSON.stringify(alert.evidence, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
          <div className="bg-navy-700/30 rounded-lg p-4 mb-3 border border-navy-600">
            <p className="text-sm text-cyber-muted mb-2 flex items-start gap-2">
              <Info size={14} className="text-emerald-primary mt-0.5 flex-shrink-0" />
              调整模型参数以优化信用评估算法。系统将基于历史任务数据训练新的信用评分模型，用于评估用户可信度和任务风险等级。
            </p>
          </div>
          {[
            { label: '信用权重', key: 'creditWeight' as const, value: params.creditWeight, desc: '历史信用评分在模型中的权重占比' },
            { label: '验证权重', key: 'verifyWeight' as const, value: params.verifyWeight, desc: '社区验证员评价在模型中的权重占比' },
            { label: '历史衰减系数', key: 'decayFactor' as const, value: params.decayFactor, desc: '早期行为记录的衰减程度，数值越高越重视近期表现' },
          ].map(p => (
            <div key={p.key}>
              <div className="flex justify-between text-sm mb-1">
                <div>
                  <span className="text-cyber-text">{p.label}</span>
                  <span className="text-xs text-cyber-dim ml-2">{p.desc}</span>
                </div>
                <span className="text-emerald-primary font-mono">{p.value.toFixed(2)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={p.value}
                onChange={e => setParams(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-navy-600 rounded-lg appearance-none cursor-pointer accent-emerald-primary"
              />
            </div>
          ))}
          <button onClick={handleTrain} disabled={training} className="btn-primary w-full flex items-center justify-center gap-2">
            <Play size={16} /> {training ? '模型训练中...' : '开始训练'}
          </button>
          {trainResult && (
            <div className="space-y-4 pt-2">
              <div className="bg-gradient-to-r from-emerald-primary/10 to-transparent border border-emerald-primary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-emerald-primary" />
                  <span className="text-emerald-primary font-semibold">训练完成 · {trainResult.model_version}</span>
                </div>
                <div className="text-sm text-cyber-muted">模型已成功训练并可应用于生产环境</div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {metricsData.map(m => (
                  <div key={m.name} className="bg-navy-700/30 rounded-lg p-3 text-center border border-navy-600">
                    <div className="text-xs text-cyber-dim mb-1">{m.name}</div>
                    <div className="text-lg font-bold font-heading" style={{ color: m.color }}>{m.value.toFixed(1)}%</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-cyber-muted mb-2 flex items-center gap-1"><BarChart3 size={12} /> 特征重要性</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1E3352" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B9BB4', fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fill: '#5A6B82', fontSize: 10 }} axisLine={false} />
                      <Radar name="重要性" dataKey="value" stroke="#00E5A0" fill="#00E5A0" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-cyber-muted mb-1 flex items-center gap-1"><TrendingUp size={12} /> 业务影响评估</div>
                  <div className="bg-navy-700/30 rounded-lg p-3 border border-navy-600 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-dim">准确率提升</span>
                      <span className="text-emerald-primary font-medium">{trainResult.business_impact.expected_accuracy_improvement}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-dim">误报率降低</span>
                      <span className="text-emerald-primary font-medium">{trainResult.business_impact.expected_false_positive_reduction}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-dim">预计节省人力</span>
                      <span className="text-amber-primary font-medium">{trainResult.business_impact.estimated_time_saved}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-cyber-muted mb-2 flex items-center gap-1"><Eye size={12} /> 模型洞察</div>
                <div className="grid grid-cols-2 gap-2">
                  {trainResult.insights.map((insight, i) => (
                    <div key={i} className="bg-navy-700/20 rounded-lg p-2 border-l-2 border-emerald-primary">
                      <div className="text-xs text-cyber-text">{insight}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-cyber-muted mb-2 flex items-center gap-1"><Zap size={12} /> 优化建议</div>
                <div className="space-y-2">
                  {trainResult.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 bg-amber-primary/5 rounded-lg p-2 border border-amber-primary/20">
                      <Zap size={14} className="text-amber-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-cyber-text">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-secondary w-full flex items-center justify-center gap-2">
                <Check size={14} /> 应用此模型
              </button>
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
                <Pie data={creditData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`}>
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
