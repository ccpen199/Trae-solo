import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'

const MODULES = ['全部', '社保查询', '就业服务', '人才服务', '劳动维权', '数据看板'] as const

const MODULE_COLORS: Record<string, string> = {
  '社保查询': 'bg-blue-100 text-blue-700',
  '就业服务': 'bg-green-100 text-green-700',
  '人才服务': 'bg-purple-100 text-purple-700',
  '劳动维权': 'bg-orange-100 text-orange-700',
  '数据看板': 'bg-teal-100 text-teal-700',
}

const PAGE_SIZE = 10

export default function Logs() {
  const { logs } = useAppStore()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [module, setModule] = useState<string>('全部')
  const [user, setUser] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (module !== '全部' && log.module !== module) return false
      if (user && !log.user.includes(user)) return false
      if (startDate && log.time < startDate) return false
      if (endDate && log.time > endDate + ' 23:59:59') return false
      return true
    })
  }, [logs, module, user, startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="gov-section-title">操作日志</h1>

      <div className="gov-card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gov-muted">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="gov-input w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gov-muted">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="gov-input w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gov-muted">所属模块</label>
            <select
              value={module}
              onChange={(e) => { setModule(e.target.value); setPage(1) }}
              className="gov-input w-36"
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gov-muted">操作用户</label>
            <input
              type="text"
              value={user}
              onChange={(e) => { setUser(e.target.value); setPage(1) }}
              placeholder="输入用户名"
              className="gov-input w-36"
            />
          </div>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="gov-table-header">
                <th className="px-5 py-3 text-left">时间</th>
                <th className="px-5 py-3 text-left">操作内容</th>
                <th className="px-5 py-3 text-center">所属模块</th>
                <th className="px-5 py-3 text-center">操作用户</th>
                <th className="px-5 py-3 text-left">IP地址</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gov-muted">
                    暂无匹配日志
                  </td>
                </tr>
              ) : (
                paginated.map((log) => (
                  <tr key={log.id} className="gov-table-row">
                    <td className="px-5 py-3 text-gov-muted whitespace-nowrap">{log.time}</td>
                    <td className="px-5 py-3 text-gov-text">{log.action}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${MODULE_COLORS[log.module] || 'bg-gray-100 text-gray-700'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-gov-text">{log.user}</td>
                    <td className="px-5 py-3 text-gov-muted font-mono text-xs">{log.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gov-border">
          <span className="text-sm text-gov-muted">
            共 {filtered.length} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gov-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gov-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
