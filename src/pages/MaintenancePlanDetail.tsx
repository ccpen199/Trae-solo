import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react'

const triggerTypeMap: Record<string, string> = {
  cycle_count: '循环次数', health_level: '健康度', fault_code: '故障码', time_based: '时间触发',
}

const taskTypeMap: Record<string, string> = {
  inspect: '检测', repair: '维修', retire: '报废', cascade: '梯次利用',
}

const planStatusMap: Record<string, string> = {
  pending: '待执行', executing: '执行中', completed: '已完成', cancelled: '已取消',
}

const planStatusColor: Record<string, string> = {
  pending: 'bg-sky-500/20 text-sky-400',
  executing: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-slate-500/20 text-slate-400',
}

const priorityMap: Record<string, string> = {
  low: '低', medium: '中', high: '高', critical: '紧急',
}

const priorityColor: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-400',
  medium: 'bg-sky-500/20 text-sky-400',
  high: 'bg-amber-500/20 text-amber-400',
  critical: 'bg-red-500/20 text-red-400',
}

export default function MaintenancePlanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentMaintenancePlan, fetchMaintenancePlan, updateMaintenancePlan, safetyAlerts, fetchSafetyAlerts } = useStore()
  const [result, setResult] = useState('')
  const [completedBy, setCompletedBy] = useState('')
  const [feedbackShown, setFeedbackShown] = useState(false)

  useEffect(() => {
    if (id) fetchMaintenancePlan(id)
  }, [id, fetchMaintenancePlan])

  useEffect(() => {
    if (currentMaintenancePlan?.battery_id) {
      fetchSafetyAlerts({ battery_id: currentMaintenancePlan.battery_id })
    }
  }, [currentMaintenancePlan?.battery_id, fetchSafetyAlerts])

  if (!currentMaintenancePlan) {
    return <div className="text-slate-400 text-center py-20">加载中...</div>
  }

  const plan = currentMaintenancePlan as any

  const highRiskAlerts = safetyAlerts.filter(a =>
    a.status !== 'resolved' && (a.severity === 'high' || a.severity === 'critical')
  )

  const handleStatusChange = async (status: string) => {
    if (!id) return
    const data: Record<string, string> = { status }
    if (status === 'completed') {
      if (result.trim()) data.result = result.trim()
      if (completedBy.trim()) data.completed_by = completedBy.trim()
    }
    const ok = await updateMaintenancePlan(id, data)
    if (ok) {
      fetchMaintenancePlan(id)
      if (status === 'completed' && highRiskAlerts.length > 0) {
        setFeedbackShown(true)
        if (plan.battery_id) fetchSafetyAlerts({ battery_id: plan.battery_id })
      }
    }
  }

  const fields = [
    { label: '电池编码', value: plan.battery_code || plan.battery_id },
    { label: '触发类型', value: triggerTypeMap[plan.trigger_type] || plan.trigger_type },
    { label: '触发条件', value: plan.trigger_condition },
    { label: '任务类型', value: taskTypeMap[plan.task_type] || plan.task_type },
    { label: '优先级', value: plan.priority, badge: true },
    { label: '状态', value: plan.status, statusBadge: true },
    { label: '计划时间', value: plan.scheduled_at?.slice(0, 16) },
    { label: '完成时间', value: plan.completed_at?.slice(0, 16) || '-' },
    { label: '完成人', value: plan.completed_by || '-' },
    { label: '创建时间', value: plan.created_at?.slice(0, 16) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/maintenance')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" />返回列表
        </button>
        <h2 className="text-xl font-semibold text-white">维护计划详情</h2>
      </div>

      {feedbackShown && (
        <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-emerald-300 font-semibold text-sm mb-1">维护已完成，安全闭环已触发</div>
              <div className="text-emerald-200/80 text-xs">
                该电池关联的 {highRiskAlerts.length} 条高风险告警已自动更新处置结论和复查信息，状态变更为"处理中"。请前往安全告警页面确认后完成闭环。
              </div>
              <button
                onClick={() => navigate('/alerts')}
                className="mt-2 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs rounded-lg transition-colors"
              >
                前往告警确认
              </button>
            </div>
          </div>
        </div>
      )}

      {highRiskAlerts.length > 0 && plan.status !== 'completed' && !feedbackShown && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-amber-300 font-semibold text-sm mb-1">
                该电池存在 {highRiskAlerts.length} 条未处理高风险告警
              </div>
              <div className="text-amber-200/80 text-xs">
                完成此维护计划后，系统将自动回写处置结论到关联告警，更新复查人和复查时间
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {fields.map((f) => (
            <div key={f.label}>
              <div className="text-xs text-slate-500 mb-1">{f.label}</div>
              {f.statusBadge ? (
                <span className={`text-xs px-2 py-0.5 rounded ${planStatusColor[plan.status] || ''}`}>
                  {planStatusMap[plan.status] || plan.status}
                </span>
              ) : f.badge ? (
                <span className={`text-xs px-2 py-0.5 rounded ${priorityColor[plan.priority] || ''}`}>
                  {priorityMap[plan.priority] || plan.priority}
                </span>
              ) : (
                <div className="text-white text-sm">{f.value || '-'}</div>
              )}
            </div>
          ))}
        </div>

        {plan.description && (
          <div className="mb-4">
            <div className="text-xs text-slate-500 mb-1">描述</div>
            <div className="text-white text-sm">{plan.description}</div>
          </div>
        )}

        {plan.result && (
          <div className="mb-4">
            <div className="text-xs text-slate-500 mb-1">执行结果</div>
            <div className="text-white text-sm">{plan.result}</div>
          </div>
        )}

        <div className="mt-4">
          {plan.status === 'pending' && (
            <div className="flex gap-3">
              <button onClick={() => handleStatusChange('executing')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors">
                开始执行
              </button>
              <button
                onClick={() => navigate(`/batteries/${plan.battery_id}`)}
                className="px-4 py-2 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-sm rounded-lg transition-colors"
              >
                查看电池
              </button>
            </div>
          )}
          {plan.status === 'executing' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">执行结果</label>
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="填写执行结果..."
                  rows={3}
                  className="w-full max-w-lg px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">完成人</label>
                <input
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  placeholder="填写完成人姓名（将同步至告警复查人）"
                  className="w-full max-w-lg px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleStatusChange('completed')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors">
                  完成维护
                </button>
                <button
                  onClick={() => navigate(`/batteries/${plan.battery_id}`)}
                  className="px-4 py-2 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-sm rounded-lg transition-colors"
                >
                  查看电池
                </button>
              </div>
            </div>
          )}
          {plan.status === 'completed' && (
            <button
              onClick={() => navigate(`/batteries/${plan.battery_id}`)}
              className="px-4 py-2 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-sm rounded-lg transition-colors"
            >
              查看电池
            </button>
          )}
        </div>
      </div>

      {safetyAlerts.length > 0 && (
        <div className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">关联安全告警</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-2 font-medium">类型</th>
                <th className="text-left px-4 py-2 font-medium">严重程度</th>
                <th className="text-left px-4 py-2 font-medium">状态</th>
                <th className="text-left px-4 py-2 font-medium">处置结论</th>
                <th className="text-left px-4 py-2 font-medium">复查人</th>
                <th className="text-left px-4 py-2 font-medium">复查时间</th>
              </tr>
            </thead>
            <tbody>
              {safetyAlerts.map((a) => {
                const alertTypeMap: Record<string, string> = { bulging: '鼓包', high_temp: '高温', insulation: '绝缘异常', capacity_decay: '容量衰减', recall: '召回' }
                const sevMap: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
                const sevColor: Record<string, string> = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-orange-400', critical: 'text-red-400' }
                const stMap: Record<string, string> = { open: '待处理', reviewing: '处理中', resolved: '已处理' }
                return (
                  <tr key={a.id} className="border-t border-slate-700/50">
                    <td className="px-4 py-2 text-slate-300">{alertTypeMap[a.alert_type] || a.alert_type}</td>
                    <td className={`px-4 py-2 ${sevColor[a.severity] || ''}`}>{sevMap[a.severity] || a.severity}</td>
                    <td className="px-4 py-2 text-slate-300">{stMap[a.status] || a.status}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{(a as any).disposition || '-'}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{(a as any).reviewer || '-'}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{(a as any).reviewed_at?.slice(0, 16) || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
