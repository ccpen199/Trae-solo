import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Plus, Search, AlertTriangle } from 'lucide-react'

const statusMap: Record<string, string> = {
  in_stock: '在库', in_use: '使用中', maintenance: '维护中', retired: '已退役', cascaded: '梯次利用',
}

const statusColor: Record<string, string> = {
  in_stock: 'bg-sky-500/20 text-sky-400',
  in_use: 'bg-emerald-500/20 text-emerald-400',
  maintenance: 'bg-amber-500/20 text-amber-400',
  retired: 'bg-slate-500/20 text-slate-400',
  cascaded: 'bg-purple-500/20 text-purple-400',
}

export default function BatteryList() {
  const navigate = useNavigate()
  const { batteries, batteriesTotal, fetchBatteries, deleteBattery, loading } = useStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const pageSize = 10

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), page_size: String(pageSize) }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (supplierFilter) params.supplier = supplierFilter
    fetchBatteries(params)
  }, [page, search, statusFilter, supplierFilter, fetchBatteries])

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该电池？')) return
    const ok = await deleteBattery(id)
    if (ok) fetchBatteries({ page: String(page), page_size: String(pageSize) })
  }

  const totalPages = Math.ceil(batteriesTotal / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">电池档案</h2>
        <button
          onClick={() => navigate('/batteries/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />新增电池
        </button>
      </div>

      <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-lg border border-slate-700/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="搜索编码/型号..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
        >
          <option value="">全部状态</option>
          <option value="in_stock">在库</option>
          <option value="in_use">使用中</option>
          <option value="maintenance">维护中</option>
          <option value="retired">已退役</option>
          <option value="cascaded">梯次利用</option>
        </select>
        <select
          value={supplierFilter}
          onChange={(e) => { setSupplierFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
        >
          <option value="">全部供应商</option>
          {[...new Set(batteries.map((b) => b.supplier))].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading.batteries ? (
        <div className="text-slate-400 text-center py-20">加载中...</div>
      ) : (
        <div className="bg-[#1E293B] rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">编码</th>
                <th className="text-left px-4 py-3 font-medium">型号</th>
                <th className="text-left px-4 py-3 font-medium">供应商</th>
                <th className="text-left px-4 py-3 font-medium">容量(Ah)</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">质保期</th>
                <th className="text-left px-4 py-3 font-medium">创建时间</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {batteries.map((b, i) => (
                <tr key={b.id} className={`border-t border-slate-700/50 ${i % 2 === 1 ? 'bg-slate-800/30' : ''} ${b.hasHighRiskAlerts ? 'bg-red-950/40 hover:bg-red-950/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sky-400 cursor-pointer hover:text-sky-300" onClick={() => navigate(`/batteries/${b.id}`)}>{b.code}</span>
                      {b.hasHighRiskAlerts && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/30 text-red-300 flex items-center gap-1 border border-red-500/40">
                          <AlertTriangle className="w-3 h-3" />高风险锁定
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{b.model}</td>
                  <td className="px-4 py-3 text-slate-300">{b.supplier}</td>
                  <td className="px-4 py-3 text-slate-300">{b.capacity}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${b.hasHighRiskAlerts ? 'bg-red-500/30 text-red-300' : (statusColor[b.status] || '')}`}>
                      {b.hasHighRiskAlerts ? '🔒 流转受限' : (statusMap[b.status] || b.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{b.warranty_date}</td>
                  <td className="px-4 py-3 text-slate-400">{b.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/batteries/${b.id}`)} className="text-sky-400 hover:text-sky-300 text-xs">查看</button>
                      {b.hasHighRiskAlerts ? (
                        <>
                          <span className="text-slate-600 text-xs cursor-not-allowed" title="存在未处理高风险告警，禁止编辑">🔒 编辑</span>
                          <span className="text-slate-600 text-xs cursor-not-allowed" title="存在未处理高风险告警，禁止删除">🔒 删除</span>
                        </>
                      ) : (
                        <>
                          <button onClick={() => navigate(`/batteries/${b.id}/edit`)} className="text-amber-400 hover:text-amber-300 text-xs">编辑</button>
                          <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300 text-xs">删除</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {batteries.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">共 {batteriesTotal} 条</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600"
            >上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 text-sm rounded ${p === page ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600"
            >下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
