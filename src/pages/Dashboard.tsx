import { useEffect } from 'react'
import { useStore } from '@/store'
import { useNavigate } from 'react-router-dom'
import { Battery, Zap, ShieldAlert, Wrench, AlertTriangle, Eye, PackageOpen, Trash2, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

const alertTypeMap: Record<string, string> = {
  bulging: '鼓包', high_temp: '高温', insulation: '绝缘异常',
  capacity_decay: '容量衰减', recall: '召回',
}

const severityMap: Record<string, string> = {
  low: '低', medium: '中', high: '高', critical: '严重',
}

const severityColor: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
}

const priorityColor: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-400',
  medium: 'bg-sky-500/20 text-sky-400',
  high: 'bg-amber-500/20 text-amber-400',
  critical: 'bg-red-500/20 text-red-400',
}

const taskTypeMap: Record<string, string> = {
  inspect: '检测', repair: '维修', retire: '报废', cascade: '梯次利用',
}

const statusMap: Record<string, string> = {
  in_stock: '在库', in_use: '使用中', maintenance: '维护中',
  retired: '已退役', cascaded: '梯次利用',
}

const extendedStatusMap: Record<string, { label: string; color: string }> = {
  high_risk: { label: '高风险', color: '#EF4444' },
  pending_review: { label: '待复查', color: '#F59E0B' },
  recall: { label: '召回批次', color: '#EC4899' },
  pending_retire: { label: '待报废', color: '#64748B' },
  pending_cascade: { label: '待梯次', color: '#8B5CF6' },
}

const PIE_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function Dashboard() {
  const { dashboard, fetchDashboard, loading } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const inUseCount = dashboard?.byStatus?.find(s => s.status === 'in_use')?.count ?? 0

  const pieData = dashboard?.byStatus?.map(s => ({
    name: statusMap[s.status] || s.status,
    value: s.count,
  })) ?? []

  const extendedPieData = (dashboard?.extendedStatus || [])
    .filter(s => s.count > 0)
    .map(s => ({
      name: extendedStatusMap[s.key]?.label || s.key,
      value: s.count,
      fill: extendedStatusMap[s.key]?.color || '#64748B',
    }))

  const mainStats = [
    { label: '电池总数', value: dashboard?.totalBatteries ?? 0, icon: Battery, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: '使用中', value: inUseCount, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: '告警数', value: dashboard?.openAlerts ?? 0, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: '待维护', value: dashboard?.pendingMaintenance ?? 0, icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  const riskStats = [
    { label: '高风险', value: dashboard?.highRiskCount ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: '待复查', value: dashboard?.pendingReviewCount ?? 0, icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: '召回批次', value: dashboard?.recallCount ?? 0, icon: PackageOpen, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: '待报废/梯次', value: (dashboard?.pendingRetireCount ?? 0) + (dashboard?.pendingCascadeCount ?? 0), icon: Trash2, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ]

  const alertStatusMap: Record<string, { label: string; color: string }> = {
    open: { label: '待处理', color: 'bg-red-500/20 text-red-400' },
    reviewing: { label: '复查中', color: 'bg-amber-500/20 text-amber-400' },
    resolved: { label: '已解决', color: 'bg-emerald-500/20 text-emerald-400' },
    closed: { label: '已关闭', color: 'bg-slate-500/20 text-slate-400' },
  }

  if (loading.dashboard) {
    return <div className="text-slate-400 text-center py-20">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {mainStats.map((s) => (
          <div key={s.label} className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {riskStats.map((s) => (
          <div key={s.label} className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50 hover:border-slate-600/50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">近期告警</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {dashboard?.recentAlerts?.length ? dashboard.recentAlerts.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className={`py-2 px-3 rounded transition-colors cursor-pointer hover:bg-slate-700/50 ${
                  ['high', 'critical'].includes(a.severity) && ['open', 'reviewing'].includes(a.status)
                    ? 'bg-red-900/20 border border-red-800/30'
                    : 'bg-slate-800/50'
                }`}
                onClick={() => navigate(`/alerts/${a.id}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">{alertTypeMap[a.alert_type] || a.alert_type}</span>
                    <span
                      className="text-xs text-sky-400 hover:text-sky-300 font-mono"
                      onClick={(e) => { e.stopPropagation(); navigate(`/batteries/${a.battery_id}`) }}
                    >
                      {a.battery_code || a.battery_id}
                    </span>
                    {['high', 'critical'].includes(a.severity) && ['open', 'reviewing'].includes(a.status) && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> 已锁定
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${alertStatusMap[a.status]?.color || ''}`}>
                      {alertStatusMap[a.status]?.label || a.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${severityColor[a.severity] || ''}`}>
                      {severityMap[a.severity] || a.severity}
                    </span>
                  </div>
                </div>
                {a.status === 'reviewing' && (a.disposition || a.reviewer) && (
                  <div className="mt-1 pl-1 py-1 text-xs text-slate-400 border-l-2 border-amber-500/50 ml-1">
                    {a.disposition && <span className="block">处置: {a.disposition}</span>}
                    {a.reviewer && <span className="block">复查人: {a.reviewer}</span>}
                    {a.reviewed_at && <span className="block">复查时间: {a.reviewed_at?.slice(0, 16)}</span>}
                  </div>
                )}
                <div className="text-xs text-slate-500">{a.alert_at?.slice(5, 16)}</div>
              </div>
            )) : <div className="text-slate-500 text-sm text-center py-8">暂无告警</div>}
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">待办维护任务</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {dashboard?.recentMaintenance?.length ? dashboard.recentMaintenance.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between py-2 px-3 rounded transition-colors cursor-pointer hover:bg-slate-700/50 ${
                  t.alert_id ? 'bg-red-900/20 border border-red-800/30' : 'bg-slate-800/50'
                }`}
                onClick={() => navigate(`/maintenance-plans/${t.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">{taskTypeMap[t.task_type] || t.task_type}</span>
                  <span
                    className="text-xs text-sky-400 hover:text-sky-300 font-mono"
                    onClick={(e) => { e.stopPropagation(); navigate(`/batteries/${t.battery_id}`) }}
                  >
                    {t.battery_code || t.battery_id}
                  </span>
                  {t.alert_id && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 关联高风险
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${priorityColor[t.priority] || ''}`}>
                    {t.priority === 'low' ? '低' : t.priority === 'medium' ? '中' : t.priority === 'high' ? '高' : '紧急'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </div>
              </div>
            )) : <div className="text-slate-500 text-sm text-center py-8">暂无待办任务</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">资产状态分布</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-500 text-sm text-center py-8">暂无数据</div>}
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">风险状态分布</h3>
          {extendedPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={extendedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {extendedPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-500 text-sm text-center py-8">暂无数据</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">资产状态统计</h3>
          <div className="space-y-3">
            {dashboard?.byStatus?.map((s, i) => {
              const total = dashboard?.totalBatteries || 1
              const pct = Math.round((s.count / total) * 100)
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-20">{statusMap[s.status] || s.status}</span>
                  <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                  <span className="text-sm text-slate-300 w-16 text-right">{s.count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">风险状态统计</h3>
          <div className="space-y-3">
            {dashboard?.extendedStatus?.filter(s => s.count > 0).map((s, i) => {
              const total = dashboard?.totalBatteries || 1
              const pct = Math.round((s.count / total) * 100)
              const meta = extendedStatusMap[s.key]
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-20">{meta?.label || s.key}</span>
                  <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta?.color || '#64748B' }} />
                  </div>
                  <span className="text-sm text-slate-300 w-16 text-right">{s.count} ({pct}%)</span>
                </div>
              )
            })}
            {!dashboard?.extendedStatus?.filter(s => s.count > 0).length && (
              <div className="text-slate-500 text-sm text-center py-8">暂无风险数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
