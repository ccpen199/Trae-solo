import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Search } from 'lucide-react'

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

export default function SafetyAlertList() {
  const navigate = useNavigate()
  const { safetyAlerts, safetyAlertsTotal, fetchSafetyAlerts, loading } = useStore()
  const [page, setPage] = useState(1)
  const [alertTypeFilter, setAlertTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const pageSize = 10

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), page_size: String(pageSize) }
    if (alertTypeFilter) params.alert_type = alertTypeFilter
    if (severityFilter) params.severity = severityFilter
    if (statusFilter) params.status = statusFilter
    fetchSafetyAlerts(params)
  }, [page, alertTypeFilter, severityFilter, statusFilter, fetchSafetyAlerts])

  const totalPages = Math.ceil(safetyAlertsTotal / pageSize)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">安全告警</h2>

      <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-lg border border-slate-700/50">
        <select value={alertTypeFilter} onChange={(e) => { setAlertTypeFilter(e.target.value); setPage(1) }} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
          <option value="">全部告警类型</option>
          <option value="bulging">鼓包</option>
          <option value="high_temp">高温</option>
          <option value="insulation">绝缘异常</option>
          <option value="capacity_decay">容量衰减</option>
          <option value="recall">召回</option>
        </select>
        <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
          <option value="">全部严重程度</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">严重</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
          <option value="">全部状态</option>
          <option value="open">待处理</option>
          <option value="reviewing">处理中</option>
          <option value="resolved">已处理</option>
        </select>
      </div>

      {loading.safetyAlerts ? (
        <div className="text-slate-400 text-center py-20">加载中...</div>
      ) : (
        <div className="bg-[#1E293B] rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">电池编码</th>
                <th className="text-left px-4 py-3 font-medium">告警类型</th>
                <th className="text-left px-4 py-3 font-medium">严重程度</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">描述</th>
                <th className="text-left px-4 py-3 font-medium">告警时间</th>
              </tr>
            </thead>
            <tbody>
              {safetyAlerts.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-t border-slate-700/50 cursor-pointer hover:bg-slate-700/30 ${i % 2 === 1 ? 'bg-slate-800/30' : ''}`}
                  onClick={() => navigate(`/alerts/${a.id}`)}
                >
                  <td className="px-4 py-3 text-sky-400">{a.battery_code || a.battery_id}</td>
                  <td className="px-4 py-3 text-slate-300">{alertTypeMap[a.alert_type] || a.alert_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${severityColor[a.severity] || ''}`}>
                      {severityMap[a.severity] || a.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${alertStatusColor[a.status] || ''}`}>
                      {alertStatusMap[a.status] || a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-48 truncate">{a.description || '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{a.alert_at?.slice(0, 16)}</td>
                </tr>
              ))}
              {safetyAlerts.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">共 {safetyAlertsTotal} 条</span>
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
