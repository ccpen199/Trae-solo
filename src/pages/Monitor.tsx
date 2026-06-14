import { useState } from 'react'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Heart,
  Search,
  AlertOctagon,
  Eye,
  Bell,
  CheckSquare,
  User,
  Building,
  FileText,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Shield,
  ClipboardCheck,
  History,
  Flame,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import {
  probeNodes,
  npsData,
  hotKeywords,
  supplyGaps,
  npsSurveys,
  gapDispositions,
  hotwordGapLinks,
  probeAlerts,
} from '@/data'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const tabs: { key: 'probe' | 'nps' | 'hotwords' | 'gap'; label: string; icon: React.ReactNode }[] = [
  { key: 'probe', label: '拨测中心', icon: <Server className="w-4 h-4" /> },
  { key: 'nps', label: 'NPS采集', icon: <Heart className="w-4 h-4" /> },
  { key: 'hotwords', label: '热词分析', icon: <Search className="w-4 h-4" /> },
  { key: 'gap', label: '缺口预警', icon: <AlertOctagon className="w-4 h-4" /> },
]

const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  healthy: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: '正常' },
  warning: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: '预警' },
  error: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: '异常' },
  offline: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400', label: '离线' },
}

const statusBarColor: Record<string, string> = {
  healthy: '#00A870',
  warning: '#D4A843',
  error: '#E34D59',
  offline: '#9CA3AF',
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', cfg.bg, cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function ProbeTab() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>(
    probeAlerts.filter((a) => a.acknowledged).map((a) => a.id)
  )

  const healthyCount = probeNodes.filter((n) => n.status === 'healthy').length
  const warningCount = probeNodes.filter((n) => n.status === 'warning').length
  const errorCount = probeNodes.filter((n) => n.status === 'error' || n.status === 'offline').length
  const activeAlertCount = probeAlerts.filter((a) => !a.acknowledged).length

  const summaryCards = [
    { label: '服务总数', value: probeNodes.length, icon: <Server className="w-5 h-5 text-gov-blue" />, color: 'text-gov-navy', trend: 'up', trendValue: '+2' },
    { label: '正常运行', value: healthyCount, icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, color: 'text-emerald-600', trend: 'up', trendValue: '+1' },
    { label: '性能预警', value: warningCount, icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, color: 'text-amber-600', trend: 'down', trendValue: '-1' },
    { label: '异常/离线', value: errorCount, icon: <XCircle className="w-5 h-5 text-red-500" />, color: 'text-red-600', trend: 'stable', trendValue: '0' },
  ]

  const selectedNode = probeNodes.find((n) => n.id === selectedNodeId)
  const nodeAlerts = (nodeId: string) => probeAlerts.filter((a) => a.nodeId === nodeId)

  const handleAcknowledge = (alertId: string) => {
    if (!acknowledgedAlerts.includes(alertId)) {
      setAcknowledgedAlerts([...acknowledgedAlerts, alertId])
    }
  }

  const alertLevelConfig: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode; pulse?: boolean }> = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: <Bell className="w-4 h-4" /> },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: <AlertTriangle className="w-4 h-4" /> },
    critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: <AlertCircle className="w-4 h-4" />, pulse: true },
  }

  const responseTimeTrend = [
    { time: '08:00', value: 45 },
    { time: '10:00', value: 52 },
    { time: '12:00', value: 68 },
    { time: '14:00', value: 55 },
    { time: '16:00', value: 62 },
    { time: '18:00', value: 48 },
    { time: '20:00', value: 42 },
    { time: '22:00', value: 38 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="gov-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              {card.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <div className={cn('text-2xl font-bold font-mono', card.color)}>{card.value}</div>
                <div className={cn('text-xs font-medium flex items-center gap-0.5',
                  card.trend === 'up' ? 'text-emerald-600' : card.trend === 'down' ? 'text-red-600' : 'text-gray-400'
                )}>
                  {card.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {card.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  {card.trend === 'stable' && <Minus className="w-3 h-3" />}
                  {card.trendValue}
                </div>
              </div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="gov-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="gov-section-title">活跃告警</h3>
            <span className="gov-badge gov-badge-red">{activeAlertCount} 条未确认</span>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-3 pb-1" style={{ minWidth: 'max-content' }}>
            {probeAlerts.map((alert) => {
              const cfg = alertLevelConfig[alert.level]
              const node = probeNodes.find((n) => n.id === alert.nodeId)
              const isAck = acknowledgedAlerts.includes(alert.id)
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'w-72 shrink-0 rounded-lg border p-4 transition-all',
                    cfg.bg,
                    cfg.border,
                    isAck && 'opacity-60',
                    cfg.pulse && !isAck && 'animate-pulse'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn('flex items-center gap-1.5 font-medium text-sm', cfg.text)}>
                      {cfg.icon}
                      {alert.level === 'critical' ? '严重告警' : alert.level === 'warning' ? '预警' : '提示'}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{alert.lastTriggered.split(' ')[1]}</span>
                  </div>
                  <div className="text-sm font-medium text-gov-navy mb-1">{alert.alertType}</div>
                  <div className="text-xs text-gray-600 mb-3 line-clamp-2">{alert.message}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <Server className="w-3 h-3" />
                    {node?.name}
                  </div>
                  {!isAck ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="w-full py-1.5 rounded text-xs font-medium bg-white border border-gray-200 text-gov-navy hover:bg-gray-50 transition-colors"
                    >
                      确认告警
                    </button>
                  ) : (
                    <div className="w-full py-1.5 text-center text-xs text-emerald-600 font-medium">
                      ✓ 已确认
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className={cn('gov-card overflow-hidden transition-all duration-300', selectedNodeId ? 'flex-1' : 'w-full')}>
          <div className="p-4 border-b border-gray-100">
            <h3 className="gov-section-title">节点列表</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-left font-medium">节点名称</th>
                  <th className="px-4 py-3 text-left font-medium">服务</th>
                  <th className="px-4 py-3 text-left font-medium">位置</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">告警数</th>
                  <th className="px-4 py-3 text-left font-medium">响应时间</th>
                  <th className="px-4 py-3 text-left font-medium">可用率</th>
                  <th className="px-4 py-3 text-left font-medium">CPU</th>
                  <th className="px-4 py-3 text-left font-medium">内存</th>
                  <th className="px-4 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {probeNodes.map((node) => {
                  const alerts = nodeAlerts(node.id)
                  const isSelected = selectedNodeId === node.id
                  return (
                    <tr
                      key={node.id}
                      onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                      className={cn(
                        'border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer',
                        isSelected && 'bg-blue-50/50'
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-gov-navy">{node.name}</td>
                      <td className="px-4 py-3 text-gray-600">{node.service}</td>
                      <td className="px-4 py-3 text-gray-600">{node.location}</td>
                      <td className="px-4 py-3"><StatusBadge status={node.status} /></td>
                      <td className="px-4 py-3">
                        {alerts.length > 0 ? (
                          <span className={cn(
                            'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                            alerts.some((a) => a.level === 'critical') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {alerts.length}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{node.responseTime} ms</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{node.uptime}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', node.cpu > 80 ? 'bg-red-500' : node.cpu > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                              style={{ width: `${node.cpu}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-gray-500">{node.cpu}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', node.memory > 80 ? 'bg-red-500' : node.memory > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                              style={{ width: `${node.memory}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-gray-500">{node.memory}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedNodeId(isSelected ? null : node.id)
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gov-blue hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedNode && (
          <div className="w-80 gov-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="gov-section-title text-base">节点详情</h3>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <div className="font-semibold text-gov-navy mb-1">{selectedNode.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5" />
                  {selectedNode.location}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">CPU 使用率</div>
                  <div className={cn('text-lg font-bold font-mono', selectedNode.cpu > 80 ? 'text-red-600' : selectedNode.cpu > 60 ? 'text-amber-600' : 'text-emerald-600')}>
                    {selectedNode.cpu}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">内存使用率</div>
                  <div className={cn('text-lg font-bold font-mono', selectedNode.memory > 80 ? 'text-red-600' : selectedNode.memory > 60 ? 'text-amber-600' : 'text-emerald-600')}>
                    {selectedNode.memory}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">磁盘使用</div>
                  <div className="text-lg font-bold font-mono text-gov-blue">67%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">网络吞吐</div>
                  <div className="text-lg font-bold font-mono text-gov-blue">128 Mbps</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gov-navy mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  响应时间趋势
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={responseTimeTrend}>
                      <defs>
                        <linearGradient id="colorRt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={30} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#1A73E8" strokeWidth={2} fill="url(#colorRt)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gov-navy mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  最近错误日志
                </div>
                <div className="space-y-2">
                  {[
                    { time: '14:28:15', msg: '连接超时，重试中...', level: 'warning' },
                    { time: '14:25:03', msg: '请求延迟超过阈值', level: 'warning' },
                    { time: '14:20:42', msg: 'CPU 使用率达到 78%', level: 'info' },
                  ].map((log, i) => (
                    <div key={i} className="text-xs p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn('font-medium', log.level === 'warning' ? 'text-amber-600' : 'text-gray-600')}>
                          {log.level === 'warning' ? 'WARN' : 'INFO'}
                        </span>
                        <span className="text-gray-400 font-mono">{log.time}</span>
                      </div>
                      <div className="text-gray-600">{log.msg}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gov-navy mb-2 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  历史趋势
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">今日可用率</span>
                    <span className="font-mono font-medium text-emerald-600">{selectedNode.uptime}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">平均响应时间</span>
                    <span className="font-mono font-medium text-gov-blue">{selectedNode.responseTime} ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">今日请求数</span>
                    <span className="font-mono font-medium text-gov-navy">{selectedNode.requests.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="gov-card p-4">
        <h3 className="gov-section-title mb-4">响应时间分布</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={probeNodes} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <XAxis dataKey="service" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value} ms`, '响应时间']} />
            <Bar dataKey="responseTime" radius={[4, 4, 0, 0]}>
              {probeNodes.map((entry, index) => (
                <rect key={index} fill={statusBarColor[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function NPSTab() {
  const { npsScore, setNpsScore, npsSurveySubmitted, setNpsSurveySubmitted } = useStore()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const promoters = npsData.tags.filter((t) => t.sentiment === 'positive').reduce((s, t) => s + t.count, 0)
  const detractors = npsData.tags.filter((t) => t.sentiment === 'negative').reduce((s, t) => s + t.count, 0)
  const passives = npsData.tags.filter((t) => t.sentiment === 'neutral').reduce((s, t) => s + t.count, 0)
  const total = promoters + detractors + passives

  const positiveTags = npsData.tags.filter((t) => t.sentiment === 'positive')
  const negativeTags = npsData.tags.filter((t) => t.sentiment === 'negative')

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = () => {
    if (npsScore !== null) {
      setNpsSurveySubmitted(true)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setNpsScore(null)
        setSelectedTags([])
        setComment('')
      }, 2000)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 7) return 'text-gov-blue bg-blue-50 border-blue-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="gov-card p-6 flex flex-col items-center justify-center">
          <div className="text-sm text-gray-500 mb-2">NPS 得分</div>
          <div className="text-6xl font-bold text-gov-navy">{npsData.score}</div>
          <div className="text-sm text-gray-400 mt-1">Net Promoter Score</div>
          <div className="w-full mt-6 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-emerald-600 font-medium">推荐者</span>
                <span className="font-mono">{promoters}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(promoters / total) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 font-medium">中立者</span>
                <span className="font-mono">{passives}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${(passives / total) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600 font-medium">贬损者</span>
                <span className="font-mono">{detractors}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${(detractors / total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">NPS 趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={npsData.trends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 80]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#1A73E8" strokeWidth={2.5} dot={{ r: 4, fill: '#1A73E8' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="gov-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="gov-section-title">NPS 问卷</h3>
          {npsSurveySubmitted && <span className="gov-badge gov-badge-green">已提交 {npsSurveys.length} 份</span>}
        </div>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="text-lg font-semibold text-gov-navy mb-1">评价提交成功</div>
            <div className="text-sm text-gray-500">感谢您的反馈，我们会持续改进服务质量</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-gov-navy mb-3">您有多大可能向朋友或同事推荐我们的服务？</div>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => setNpsScore(score)}
                    className={cn(
                      'w-10 h-10 rounded-lg font-medium text-sm border-2 transition-all',
                      npsScore === score
                        ? score >= 9
                          ? 'bg-emerald-500 text-white border-emerald-500 scale-110'
                          : score >= 7
                            ? 'bg-gov-blue text-white border-gov-blue scale-110'
                            : 'bg-red-500 text-white border-red-500 scale-110'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gov-blue hover:text-gov-blue'
                    )}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                <span>完全不可能</span>
                <span>非常可能</span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gov-navy mb-3">选择标签（可多选）</div>
              <div className="mb-4">
                <div className="text-xs text-emerald-600 mb-2 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> 正面评价
                </div>
                <div className="flex flex-wrap gap-2">
                  {positiveTags.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => toggleTag(tag.name)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                        selectedTags.includes(tag.name)
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-red-600 mb-2 flex items-center gap-1">
                  <ThumbsDown className="w-3 h-3" /> 负面评价
                </div>
                <div className="flex flex-wrap gap-2">
                  {negativeTags.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => toggleTag(tag.name)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                        selectedTags.includes(tag.name)
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gov-navy mb-3">您的建议（选填）</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入您的宝贵建议..."
                className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={npsScore === null}
              className={cn(
                'w-full py-2.5 rounded-lg font-medium transition-all',
                npsScore !== null
                  ? 'bg-gov-navy text-white hover:bg-gov-dark'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              提交评价
            </button>
          </div>
        )}
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">最近评价</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {npsSurveys.slice(0, 8).map((survey) => (
            <div
              key={survey.id}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                survey.score >= 9 ? 'border-emerald-200 bg-emerald-50/50' :
                survey.score >= 7 ? 'border-blue-200 bg-blue-50/50' :
                'border-red-200 bg-red-50/50'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    survey.score >= 9 ? 'bg-emerald-500 text-white' :
                    survey.score >= 7 ? 'bg-gov-blue text-white' :
                    'bg-red-500 text-white'
                  )}>
                    {survey.score}
                  </div>
                  <div>
                    <div className="font-medium text-gov-navy text-sm">{survey.serviceName}</div>
                    <div className="text-xs text-gray-500">{survey.submitTime}</div>
                  </div>
                </div>
                {survey.score >= 9 ? (
                  <ThumbsUp className="w-4 h-4 text-emerald-500" />
                ) : survey.score >= 7 ? (
                  <Meh className="w-4 h-4 text-gov-blue" />
                ) : (
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="text-sm text-gray-600 mb-2 line-clamp-2">{survey.comment}</div>
              <div className="flex flex-wrap gap-1.5">
                {survey.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-white/80 rounded text-xs text-gray-600 border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">标签云</h3>
        <div className="flex flex-wrap gap-2">
          {npsData.tags.map((tag) => {
            const maxCount = Math.max(...npsData.tags.map((t) => t.count))
            const minCount = Math.min(...npsData.tags.map((t) => t.count))
            const ratio = (tag.count - minCount) / (maxCount - minCount)
            const sizeClass = ratio > 0.7 ? 'text-lg' : ratio > 0.4 ? 'text-base' : 'text-sm'
            const sentimentClass =
              tag.sentiment === 'positive'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : tag.sentiment === 'negative'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
            return (
              <span key={tag.name} className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-full border font-medium', sizeClass, sentimentClass)}>
                {tag.name}
                <span className="text-xs opacity-60 font-mono">{tag.count}</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HotwordsTab() {
  const { setMonitorTab, setSelectedGapId } = useStore()
  const top10 = hotKeywords.slice(0, 10)
  const noResultKeywords = hotKeywords
    .filter((kw) => kw.noResultCount > 200)
    .sort((a, b) => b.noResultCount - a.noResultCount)
    .slice(0, 5)

  const getGapForHotword = (hotword: string) => {
    return hotwordGapLinks.find((link) => link.hotword === hotword)
  }

  const jumpToGap = (gapId: string) => {
    setSelectedGapId(gapId)
    setMonitorTab('gap')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">热门搜索 TOP 10</h3>
          <div className="space-y-3">
            {top10.map((kw, index) => {
              const gap = getGapForHotword(kw.keyword)
              return (
                <div
                  key={kw.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold',
                      index < 3 ? 'bg-gov-gold/20 text-gov-gold' : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gov-navy truncate">{kw.keyword}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-gray-500">{kw.count.toLocaleString()} 次</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gov-blue">转化率 {kw.conversionRate * 100}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {kw.trend === 'up' && (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3" />
                        +{Math.floor(Math.random() * 20 + 5)}%
                      </span>
                    )}
                    {kw.trend === 'down' && (
                      <span className="flex items-center gap-0.5 text-xs text-red-600 font-medium">
                        <TrendingDown className="w-3 h-3" />
                        -{Math.floor(Math.random() * 15 + 3)}%
                      </span>
                    )}
                    {kw.trend === 'stable' && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Minus className="w-3 h-3" />
                        持平
                      </span>
                    )}
                  </div>
                  {gap && (
                    <button
                      onClick={() => jumpToGap(gap.gapId)}
                      className="shrink-0 px-2 py-1 text-xs text-gov-blue bg-blue-50 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <AlertOctagon className="w-3 h-3" />
                      关联缺口
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">搜索量分布</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top10} margin={{ top: 5, right: 20, left: 10, bottom: 60 }} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="keyword" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(value: number) => [value.toLocaleString(), '搜索量']} />
              <Bar dataKey="count" fill="#1A73E8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="gov-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="gov-section-title flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            无结果热词
          </h3>
          <span className="gov-badge gov-badge-red">需重点关注</span>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {noResultKeywords.map((kw) => {
            const gap = getGapForHotword(kw.keyword)
            return (
              <div
                key={kw.id}
                className="p-4 rounded-lg bg-red-50 border border-red-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-gov-navy text-sm">{kw.keyword}</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  无结果 <span className="font-mono text-red-600 font-bold">{kw.noResultCount}</span> 次
                </div>
                {gap ? (
                  <button
                    onClick={() => jumpToGap(gap.gapId)}
                    className="w-full py-1.5 text-xs text-gov-blue bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <AlertOctagon className="w-3 h-3" />
                    关联服务缺口
                  </button>
                ) : (
                  <div className="w-full py-1.5 text-center text-xs text-gray-400">
                    待分析
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">热词-缺口关联分析</h3>
        <div className="grid grid-cols-4 gap-4">
          {hotwordGapLinks.slice(0, 8).map((link, index) => {
            const gap = supplyGaps.find((g) => g.id === link.gapId)
            const kw = hotKeywords.find((k) => k.keyword === link.hotword)
            return (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-100 hover:border-gov-blue/30 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => jumpToGap(link.gapId)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-gov-blue" />
                  <span className="font-medium text-sm text-gov-navy">{link.hotword}</span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <ChevronRight className="w-4 h-4 text-gov-gold mx-2" />
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-600 truncate">{gap?.service}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  关联强度 <span className="text-gov-blue font-medium">{(link.correlationStrength * 100).toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GapTab() {
  const { selectedGapId, setSelectedGapId } = useStore()

  const getSeverity = (gap: typeof supplyGaps[0]) => {
    if (gap.gap > 3000) return { label: '高', color: 'border-red-400', bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700 border-red-300' }
    if (gap.gap >= 1000) return { label: '中', color: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-300' }
    return { label: '低', color: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-300' }
  }

  const getPriority = (priority: string) => {
    switch (priority) {
      case 'high': return { label: '高', className: 'gov-badge gov-badge-red' }
      case 'medium': return { label: '中', className: 'gov-badge gov-badge-yellow' }
      case 'low': return { label: '低', className: 'gov-badge gov-badge-blue' }
      default: return { label: '低', className: 'gov-badge gov-badge-blue' }
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'worsening': return <TrendingUp className="w-3.5 h-3.5 text-red-500" />
      case 'improving': return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
      default: return <Minus className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'worsening': return '恶化'
      case 'improving': return '改善'
      default: return '稳定'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待处置'
      case 'processing': return '处置中'
      case 'resolved': return '已解决'
      case 'reviewed': return '已复查'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'reviewed': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const selectedGap = supplyGaps.find((g) => g.id === selectedGapId)
  const selectedDisposition = gapDispositions.find((d) => d.gapId === selectedGapId)

  const stats = {
    pending: gapDispositions.filter((d) => d.status === 'pending').length,
    processing: gapDispositions.filter((d) => d.status === 'processing').length,
    resolved: gapDispositions.filter((d) => d.status === 'resolved').length,
    reviewed: gapDispositions.filter((d) => d.status === 'reviewed').length,
  }
  const totalGaps = gapDispositions.length

  const trendData = [
    { month: '1月', demand: 8500, supply: 7200 },
    { month: '2月', demand: 9200, supply: 7500 },
    { month: '3月', demand: 9800, supply: 7800 },
    { month: '4月', demand: 10500, supply: 8000 },
    { month: '5月', demand: 11200, supply: 8300 },
    { month: '6月', demand: 12000, supply: 8500 },
  ]

  return (
    <div className="space-y-6">
      <div className="gov-card p-5">
        <h3 className="gov-section-title mb-4">处置进度总览</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">待处置</span>
              <span className="font-mono font-bold text-gray-600">{stats.pending}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-400 rounded-full" style={{ width: `${(stats.pending / totalGaps) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">处置中</span>
              <span className="font-mono font-bold text-gov-blue">{stats.processing}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gov-blue rounded-full" style={{ width: `${(stats.processing / totalGaps) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">已解决</span>
              <span className="font-mono font-bold text-emerald-600">{stats.resolved}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.resolved / totalGaps) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">已复查</span>
              <span className="font-mono font-bold text-purple-600">{stats.reviewed}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(stats.reviewed / totalGaps) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className={cn('transition-all duration-300', selectedGapId ? 'flex-1' : 'w-full')}>
          <div className="grid grid-cols-2 gap-4">
            {supplyGaps.map((gap) => {
              const severity = getSeverity(gap)
              const priority = getPriority(gap.priority)
              const disposition = gapDispositions.find((d) => d.gapId === gap.id)
              const ratio = gap.gap / gap.demand
              const isSelected = selectedGapId === gap.id
              return (
                <div
                  key={gap.id}
                  onClick={() => setSelectedGapId(isSelected ? null : gap.id)}
                  className={cn(
                    'gov-card p-5 border-l-4 cursor-pointer transition-all hover:shadow-md',
                    severity.color,
                    isSelected && 'ring-2 ring-gov-blue ring-offset-2'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gov-navy">{gap.service}</h4>
                        <span className={priority.className}>{priority.label}优先级</span>
                      </div>
                      <div className="text-sm text-gray-500">{gap.department}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(gap.trend)}
                      <span className={cn(
                        'text-xs font-medium',
                        gap.trend === 'worsening' ? 'text-red-600' :
                        gap.trend === 'improving' ? 'text-emerald-600' : 'text-gray-500'
                      )}>
                        {getTrendLabel(gap.trend)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>需求量</span>
                        <span className="font-mono">{gap.demand.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gov-blue rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>供给量</span>
                        <span className="font-mono">{gap.supply.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(gap.supply / gap.demand) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn('w-4 h-4', severity.text)} />
                      <span className="text-gray-600">缺口</span>
                    </div>
                    <span className={cn('font-bold font-mono text-lg', severity.text)}>
                      {gap.gap.toLocaleString()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {gap.hotwordReferences.slice(0, 3).map((hw) => (
                        <span key={hw} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {hw}
                        </span>
                      ))}
                      {gap.hotwordReferences.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                          +{gap.hotwordReferences.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', getStatusColor(disposition?.status || 'pending'))}>
                      {getStatusLabel(disposition?.status || 'pending')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      缺口率 <span className={cn('font-mono font-medium', severity.text)}>{(ratio * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedGap && selectedDisposition && (
          <div className="w-96 gov-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="gov-section-title text-base">缺口详情</h3>
              <button
                onClick={() => setSelectedGapId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <div className="font-semibold text-gov-navy text-lg mb-1">{selectedGap.service}</div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5" />
                  {selectedGap.department}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-xs text-gray-500 mb-1">需求</div>
                  <div className="text-lg font-bold font-mono text-gov-blue">{selectedGap.demand}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <div className="text-xs text-gray-500 mb-1">供给</div>
                  <div className="text-lg font-bold font-mono text-emerald-600">{selectedGap.supply}</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <div className="text-xs text-gray-500 mb-1">缺口</div>
                  <div className="text-lg font-bold font-mono text-red-600">{selectedGap.gap}</div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">缺口描述</div>
                <div className="text-sm text-gray-700">{selectedGap.description}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gov-navy mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  趋势分析
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={40} />
                      <Tooltip />
                      <Line type="monotone" dataKey="demand" stroke="#1A73E8" strokeWidth={2} dot={{ r: 3 }} name="需求" />
                      <Line type="monotone" dataKey="supply" stroke="#00A870" strokeWidth={2} dot={{ r: 3 }} name="供给" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gov-navy mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  关联热词
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGap.hotwordReferences.map((hw) => (
                    <span key={hw} className="px-2.5 py-1 bg-gov-gold/10 text-gov-gold rounded-full text-xs font-medium">
                      {hw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gov-navy mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  处置进展
                </div>
                <div className="space-y-3">
                  {['pending', 'processing', 'resolved', 'reviewed'].map((status, index) => {
                    const statusOrder = ['pending', 'processing', 'resolved', 'reviewed']
                    const currentIndex = statusOrder.indexOf(selectedDisposition.status)
                    const thisIndex = statusOrder.indexOf(status)
                    const isActive = thisIndex <= currentIndex
                    const isCurrent = status === selectedDisposition.status
                    return (
                      <div key={status} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            isActive ? 'bg-gov-blue text-white' : 'bg-gray-200 text-gray-400',
                            isCurrent && 'ring-2 ring-gov-blue/30'
                          )}>
                            {index + 1}
                          </div>
                          {index < 3 && (
                            <div className={cn('w-0.5 flex-1 min-h-6', isActive && thisIndex < currentIndex ? 'bg-gov-blue' : 'bg-gray-200')} />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className={cn('text-sm font-medium', isActive ? 'text-gov-navy' : 'text-gray-400')}>
                            {getStatusLabel(status)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {status === 'pending' && selectedDisposition.createdAt}
                            {status === 'processing' && selectedDisposition.updatedAt}
                            {status === 'resolved' && selectedDisposition.status === 'resolved' ? selectedDisposition.updatedAt : '—'}
                            {status === 'reviewed' && (selectedDisposition.reviewResult ? selectedDisposition.updatedAt : '—')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gov-navy mb-2 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  处置措施
                </div>
                <div className="space-y-2">
                  {selectedDisposition.measures.map((measure, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                      <CheckSquare className="w-4 h-4 text-gov-blue shrink-0 mt-0.5" />
                      <span className="text-gray-700">{measure}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    责任部门
                  </div>
                  <div className="text-sm font-medium text-gov-navy">{selectedDisposition.assigneeDepartment}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    负责人
                  </div>
                  <div className="text-sm font-medium text-gov-navy">{selectedDisposition.assignee}</div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    复查状态
                  </div>
                  {selectedDisposition.reviewResult ? (
                    <span className={cn('gov-badge',
                      selectedDisposition.reviewResult === 'pass' ? 'gov-badge-green' :
                      selectedDisposition.reviewResult === 'fail' ? 'gov-badge-red' :
                      'gov-badge-yellow'
                    )}>
                      {selectedDisposition.reviewResult === 'pass' ? '通过' :
                       selectedDisposition.reviewResult === 'fail' ? '未通过' : '待复查'}
                    </span>
                  ) : (
                    <span className="gov-badge gov-badge-yellow">待复查</span>
                  )}
                </div>
                {selectedDisposition.resolution && (
                  <div className="text-sm text-gray-600 mt-2">{selectedDisposition.resolution}</div>
                )}
              </div>

              <div className="flex gap-2">
                {selectedDisposition.status === 'processing' && (
                  <button className="flex-1 py-2 bg-gov-navy text-white rounded-lg text-sm font-medium hover:bg-gov-dark transition-colors">
                    确认处置
                  </button>
                )}
                {(selectedDisposition.status === 'resolved' || selectedDisposition.status === 'reviewed') && (
                  <button className="flex-1 py-2 border border-gov-blue text-gov-blue rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                    申请复查
                  </button>
                )}
                {selectedDisposition.status === 'pending' && (
                  <button className="flex-1 py-2 bg-gov-blue text-white rounded-lg text-sm font-medium hover:bg-gov-dark transition-colors">
                    开始处置
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Monitor() {
  const { monitorTab, setMonitorTab } = useStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMonitorTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
              monitorTab === tab.key
                ? 'bg-gov-navy text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gov-navy'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {monitorTab === 'probe' && <ProbeTab />}
      {monitorTab === 'nps' && <NPSTab />}
      {monitorTab === 'hotwords' && <HotwordsTab />}
      {monitorTab === 'gap' && <GapTab />}
    </div>
  )
}