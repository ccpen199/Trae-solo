import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Search } from 'lucide-react'

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

export default function MaintenancePlanList() {
  const navigate = useNavigate()
  const { maintenancePlans, maintenancePlansTotal, fetchMaintenancePlans, updateMaintenancePlan, loading } = useStore()
  const [page, setPage] = useState(1)
  const [triggerFilter, setTriggerFilter] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const pageSize = 10

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), page_size: String(pageSize) }
    if (triggerFilter) params.trigger_type = triggerFilter
    if (taskTypeFilter) params.task_type = taskTypeFilter
    if (statusFilter) params.status = statusFilter
    if (priorityFilter) params.priority = priorityFilter
    fetchMaintenancePlans(params)
  }, [page, triggerFilter, taskTypeFilter, statusFilter, priorityFilter, fetchMaintenancePlans])

  const handleAction = async (id: string, status: string) => {
    const ok = await updateMaintenancePlan(id, { status })
    if (ok) {
      const params: Record<string, string> = { page: String(page), page_size: String(pageSize) }
      fetchMaintenancePlans(params)
    }
  }

  const totalPages = Math.ceil(maintenancePlansTotal / pageSize)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">维护计划</h2>

      <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-lg border border-slate-700/50">
        <select value={triggerFilter} onChange={(e) => { setTriggerFilter(e.target.value); setPage(1) }} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
          <option value="">全部触发类型</option>
          <option value="cycle_count">循环次数</option>
          <option value="health_level">健康度</option>
          <option value="fault_code">故障码</option>
          <option value="time_based">时间触发</option>
        </select>
        <select value={taskTypeFilter} onChange={(e) => { setTaskTypeFilter(e.target.value); setPage(1) }} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
          <option value="">全部任务类型</option>
          <option value="inspect">检测</option>
          <option value="repair">维修</option>
          <option value="retire">报废</option>
          <option value="cascade">梯次利用</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
          <option value="">全部状态</option>
          <option value="pending">待执行</option>
          <option value="executing">执行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
          <option value="">全部优先级</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">紧急</option>
        </select>
      </div>

      {loading.maintenancePlans ? (
        <div className="text-slate-400 text-center py-20">加载中...</div>
      ) : (
        <div className="bg-[#1E293B] rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">电池编码</th>
                <th className="text-left px-4 py-3 font-medium">触发类型</th>
                <th className="text-left px-4 py-3 font-medium">任务类型</th>
                <th className="text-left px-4 py-3 font-medium">优先级</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">计划时间</th>
                <th className="text-left px-4 py-3 font-medium">描述</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {maintenancePlans.map((p, i) => (
                <tr key={p.id} className={`border-t border-slate-700/50 ${i % 2 === 1 ? 'bg-slate-800/30' : ''}`}>
                  <td className="px-4 py-3 text-sky-400">{p.battery_code || p.battery_id}</td>
                  <td className="px-4 py-3 text-slate-300">{triggerTypeMap[p.trigger_type] || p.trigger_type}</td>
                  <td className="px-4 py-3 text-slate-300">{taskTypeMap[p.task_type] || p.task_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${priorityColor[p.priority] || ''}`}>
                      {priorityMap[p.priority] || p.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${planStatusColor[p.status] || ''}`}>
                      {planStatusMap[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.scheduled_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-40 truncate">{p.description || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/maintenance/${p.id}`)} className="text-sky-400 hover:text-sky-300 text-xs">查看</button>
                      {p.status === 'pending' && (
                        <button onClick={() => handleAction(p.id, 'executing')} className="text-amber-400 hover:text-amber-300 text-xs">执行</button>
                      )}
                      {p.status === 'executing' && (
                        <button onClick={() => handleAction(p.id, 'completed')} className="text-emerald-400 hover:text-emerald-300 text-xs">完成</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {maintenancePlans.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">共 {maintenancePlansTotal} 条</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600">上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm rounded ${p === page ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
