import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { ArrowLeft } from 'lucide-react'

const alertTypeMap: Record<string, string> = {
  bulging: '鼓包', high_temp: '高温', insulation: '绝缘异常', capacity_decay: '容量衰减', recall: '召回',
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

const alertStatusMap: Record<string, string> = {
  open: '待处理', reviewing: '处理中', resolved: '已处理',
}

const alertStatusColor: Record<string, string> = {
  open: 'bg-red-500/20 text-red-400',
  reviewing: 'bg-amber-500/20 text-amber-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
}

const triggerTypeMap: Record<string, string> = {
  cycle_count: '循环次数', health_level: '健康度', fault_code: '故障码', time_based: '时间触发',
}

const taskTypeMap: Record<string, string> = {
  inspect: '检测', repair: '维修', retire: '报废', cascade: '梯次利用',
}

const planStatusMap: Record<string, string> = {
  pending: '待执行', executing: '执行中', completed: '已完成', cancelled: '已取消',
}

export default function SafetyAlertDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentAlert, fetchSafetyAlert, updateSafetyAlert, maintenancePlans, fetchMaintenancePlans } = useStore()
  const [resolution, setResolution] = useState('')
  const [disposition, setDisposition] = useState('')
  const [reviewer, setReviewer] = useState('')

  useEffect(() => {
    if (id) fetchSafetyAlert(id)
  }, [id, fetchSafetyAlert])

  useEffect(() => {
    if (currentAlert?.battery_id) {
      fetchMaintenancePlans({ battery_id: currentAlert.battery_id })
    }
  }, [currentAlert?.battery_id, fetchMaintenancePlans])

  if (!currentAlert) {
    return <div className="text-slate-400 text-center py-20">加载中...</div>
  }

  const alertData = currentAlert

  const handleResolve = async () => {
    if (!id) return
    if (!disposition.trim()) {
      window.alert('请填写处置结论')
      return
    }
    if (!reviewer.trim()) {
      window.alert('请填写复查人')
      return
    }
    const ok = await updateSafetyAlert(id, {
      status: 'resolved',
      resolution: resolution.trim(),
      disposition: disposition.trim(),
      reviewer: reviewer.trim(),
    })
    if (ok) fetchSafetyAlert(id)
  }

  const handleReview = async () => {
    if (!id) return
    const ok = await updateSafetyAlert(id, { status: 'reviewing' })
    if (ok) fetchSafetyAlert(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/alerts')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" />返回列表
        </button>
        <h2 className="text-xl font-semibold text-white">告警详情</h2>
      </div>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-xs text-slate-500 mb-1">告警类型</div>
            <div className="text-white text-sm">{alertTypeMap[alertData.alert_type] || alertData.alert_type}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">严重程度</div>
            <span className={`text-xs px-2 py-0.5 rounded ${severityColor[alertData.severity] || ''}`}>
              {severityMap[alertData.severity] || alertData.severity}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">状态</div>
            <span className={`text-xs px-2 py-0.5 rounded ${alertStatusColor[alertData.status] || ''}`}>
              {alertStatusMap[alertData.status] || alertData.status}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">告警时间</div>
            <div className="text-white text-sm">{alertData.alert_at?.slice(0, 19) || '-'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-slate-500 mb-1">描述</div>
            <div className="text-white text-sm">{alertData.description || '-'}</div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 mb-4">
          <div className="text-xs text-slate-500 mb-2">关联电池</div>
          <button
            onClick={() => navigate(`/batteries/${alertData.battery_id}`)}
            className="text-sky-400 hover:text-sky-300 text-sm"
          >
            {alertData.battery_code || alertData.battery_id} →
          </button>
        </div>

        {alertData.status !== 'resolved' && (
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm text-white font-semibold mb-3">告警处理</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">处置结论 <span className="text-red-400">*</span></label>
                <select
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">请选择处置结论</option>
                  <option value="限制充电功率，持续监控">限制充电功率，持续监控</option>
                  <option value="暂停使用，安排检修">暂停使用，安排检修</option>
                  <option value="强制退役，转梯次利用评估">强制退役，转梯次利用评估</option>
                  <option value="禁止使用，立即退役回收">禁止使用，立即退役回收</option>
                  <option value="发起批次召回排查">发起批次召回排查</option>
                  <option value="降级使用，缩短巡检周期">降级使用，缩短巡检周期</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">复查人 <span className="text-red-400">*</span></label>
                <input
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  placeholder="请输入复查人姓名"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">处理说明</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="填写处理说明..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex gap-3">
                {alertData.status === 'open' && (
                  <button onClick={handleReview} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors">
                    开始处理
                  </button>
                )}
                <button onClick={handleResolve} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors">
                  确认处理完成
                </button>
              </div>
            </div>
          </div>
        )}

        {alertData.status === 'resolved' && (
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm text-white font-semibold mb-3">处理结果</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">处置结论</div>
                <div className="text-white text-sm">{alertData.disposition || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">复查人</div>
                <div className="text-white text-sm">{alertData.reviewer || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">复查时间</div>
                <div className="text-white text-sm">{alertData.reviewed_at?.slice(0, 19) || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">处理完成时间</div>
                <div className="text-white text-sm">{alertData.resolved_at?.slice(0, 19) || '-'}</div>
              </div>
              {alertData.resolution && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-1">处理说明</div>
                  <div className="text-white text-sm">{alertData.resolution}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-4">关联维护计划</h3>
        {maintenancePlans.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-2 font-medium">触发类型</th>
                <th className="text-left px-4 py-2 font-medium">任务类型</th>
                <th className="text-left px-4 py-2 font-medium">状态</th>
                <th className="text-left px-4 py-2 font-medium">计划时间</th>
              </tr>
            </thead>
            <tbody>
              {maintenancePlans.map((p) => (
                <tr key={p.id} className="border-t border-slate-700/50">
                  <td className="px-4 py-2 text-slate-300">{triggerTypeMap[p.trigger_type] || p.trigger_type}</td>
                  <td className="px-4 py-2 text-slate-300">{taskTypeMap[p.task_type] || p.task_type}</td>
                  <td className="px-4 py-2 text-slate-300">{planStatusMap[p.status] || p.status}</td>
                  <td className="px-4 py-2 text-slate-400">{p.scheduled_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-slate-500 text-sm text-center py-6">暂无关联维护计划</div>
        )}
      </div>
    </div>
  )
}
