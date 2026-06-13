import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock, CheckCircle2, Search, X, Send, UserPlus, Loader2 } from 'lucide-react'

interface Alert {
  id: string
  waybill_no: string
  type: string
  level: string
  stagnant_hours: number
  status: string
  assignee: string | null
  remarks: { author: string; content: string; time: string }[]
  created_at: string
  updated_at: string
}

interface Statistics {
  total: number
  by_status: Record<string, number>
  by_level: Record<string, number>
  by_type: Record<string, number>
}

const typeMap: Record<string, string> = { stagnant: '滞留', delivery_delay: '配送延迟', damage: '损坏', complaint: '投诉', pickup_delay: '取件延迟' }
const statusMap: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决' }
const levelBadge: Record<string, string> = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-info' }
const statusBadge: Record<string, string> = { pending: 'badge-danger', processing: 'badge-warning', resolved: 'badge-success' }
const assignees = ['李运营', '王管理']

export default function Alerts() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Alert | null>(null)
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)
  const pageSize = 20

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts/statistics')
      const json = await res.json()
      if (json.success) setStats(json.data)
    } catch {}
  }, [])

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (statusFilter) params.set('status', statusFilter)
      if (levelFilter) params.set('level', levelFilter)
      const res = await fetch(`/api/alerts?${params}`)
      const json = await res.json()
      if (json.success) {
        setAlerts(json.data.list)
        setTotal(json.data.total)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [page, statusFilter, levelFilter])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const updateAlert = async (id: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.success) {
        setSelected(json.data)
        fetchAlerts()
        fetchStats()
      }
    } catch {}
  }

  const addRemark = async () => {
    if (!selected || !remark.trim()) return
    try {
      const res = await fetch(`/api/alerts/${selected.id}/remarks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: '管理员', content: remark.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSelected(json.data)
        setRemark('')
        fetchAlerts()
      }
    } catch {}
  }

  const filtered = search ? alerts.filter((a) => a.waybill_no.includes(search)) : alerts
  const totalPages = Math.ceil(total / pageSize)
  const statCards = [
    { label: '总预警', value: stats?.total ?? 0, icon: AlertTriangle, color: 'text-navy bg-navy/10' },
    { label: '待处理', value: stats?.by_status?.pending ?? 0, icon: Clock, color: 'text-danger bg-danger/10' },
    { label: '处理中', value: stats?.by_status?.processing ?? 0, icon: Loader2, color: 'text-warning bg-warning/10' },
    { label: '已解决', value: stats?.by_status?.resolved ?? 0, icon: CheckCircle2, color: 'text-success bg-success/10' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-lighter">{s.label}</p>
              <p className="text-xl font-bold text-navy">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-field w-auto text-sm">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
          </select>
          <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1) }}
            className="input-field w-auto text-sm">
            <option value="">全部级别</option>
            <option value="high">高危</option>
            <option value="medium">中危</option>
            <option value="low">低危</option>
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input className="input-field pl-9 text-sm" placeholder="搜索运单号" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-text-lighter text-left">
                <th className="py-2 px-3 font-medium">运单号</th>
                <th className="py-2 px-3 font-medium">类型</th>
                <th className="py-2 px-3 font-medium">级别</th>
                <th className="py-2 px-3 font-medium">滞留时长</th>
                <th className="py-2 px-3 font-medium">状态</th>
                <th className="py-2 px-3 font-medium">处理人</th>
                <th className="py-2 px-3 font-medium">创建时间</th>
                <th className="py-2 px-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-10 text-center text-text-lighter"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-text-lighter">暂无数据</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-surface/50 cursor-pointer transition-colors" onClick={() => setSelected(a)}>
                  <td className="py-2.5 px-3 font-medium text-navy">{a.waybill_no}</td>
                  <td className="py-2.5 px-3">{typeMap[a.type] ?? a.type}</td>
                  <td className="py-2.5 px-3"><span className={`badge ${levelBadge[a.level] ?? 'badge'}`}>{a.level}</span></td>
                  <td className="py-2.5 px-3">{a.stagnant_hours}h</td>
                  <td className="py-2.5 px-3"><span className={`badge ${statusBadge[a.status] ?? 'badge'}`}>{statusMap[a.status] ?? a.status}</span></td>
                  <td className="py-2.5 px-3">{a.assignee ?? '-'}</td>
                  <td className="py-2.5 px-3 text-text-light">{a.created_at}</td>
                  <td className="py-2.5 px-3"><button className="text-accent text-xs font-medium hover:underline">详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-text-lighter">共 {total} 条</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline text-xs px-3 py-1 disabled:opacity-40">上一页</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-outline text-xs px-3 py-1 disabled:opacity-40">下一页</button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-navy">预警详情</h3>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-text-lighter" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-text-lighter text-sm">运单号</span><span className="font-medium text-navy text-sm">{selected.waybill_no}</span></div>
                <div className="flex justify-between"><span className="text-text-lighter text-sm">类型</span><span className="text-sm">{typeMap[selected.type] ?? selected.type}</span></div>
                <div className="flex justify-between"><span className="text-text-lighter text-sm">级别</span><span className={`badge ${levelBadge[selected.level] ?? 'badge'}`}>{selected.level}</span></div>
                <div className="flex justify-between"><span className="text-text-lighter text-sm">滞留时长</span><span className="text-sm">{selected.stagnant_hours}h</span></div>
                <div className="flex justify-between"><span className="text-text-lighter text-sm">状态</span><span className={`badge ${statusBadge[selected.status] ?? 'badge'}`}>{statusMap[selected.status] ?? selected.status}</span></div>
                <div className="flex justify-between"><span className="text-text-lighter text-sm">处理人</span><span className="text-sm">{selected.assignee ?? '未分配'}</span></div>
                <div className="flex justify-between"><span className="text-text-lighter text-sm">创建时间</span><span className="text-sm">{selected.created_at}</span></div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="section-title text-sm mb-3">处理动态</p>
                {selected.remarks.length === 0 ? (
                  <p className="text-xs text-text-lighter">暂无处理记录</p>
                ) : (
                  <div className="space-y-3">
                    {selected.remarks.map((r, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
                          {i < selected.remarks.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-navy">{r.author}</span>
                            <span className="text-xs text-text-lighter">{r.time}</span>
                          </div>
                          <p className="text-sm text-text-light">{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 p-5 space-y-3">
              {selected.status !== 'resolved' && (
                <div className="flex flex-wrap gap-2">
                  {!selected.assignee && (
                    <div className="relative group">
                      <button className="btn-outline text-xs flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" />分配处理人</button>
                      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[100px]">
                        {assignees.map((name) => (
                          <button key={name} onClick={() => updateAlert(selected.id, { assignee: name })}
                            className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface text-text">{name}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.status === 'pending' && (
                    <button onClick={() => updateAlert(selected.id, { status: 'processing' })} className="btn-navy text-xs">标记处理中</button>
                  )}
                  {selected.status === 'processing' && (
                    <button onClick={() => updateAlert(selected.id, { status: 'resolved' })} className="btn-primary text-xs">标记已解决</button>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <textarea value={remark} onChange={(e) => setRemark(e.target.value)}
                  className="input-field text-sm min-h-[40px] resize-none flex-1" placeholder="添加备注..." />
                <button onClick={addRemark} disabled={!remark.trim()} className="btn-primary self-end disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
