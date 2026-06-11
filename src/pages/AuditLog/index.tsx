import { useState, useMemo } from 'react'
import { Download, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useAuditLog } from '@/hooks/useAuditLog'
import { mockAuditLogs } from '@/mock/data'
import type { AuditLogEntry } from '@/types'

const categoryMap: Record<AuditLogEntry['category'], { label: string; cls: string }> = {
  query: { label: '查询', cls: 'bg-blue-100 text-blue-700' },
  transfer: { label: '转移', cls: 'bg-teal-100 text-teal-700' },
  claim: { label: '申领', cls: 'bg-orange-100 text-orange-700' },
  certify: { label: '认证', cls: 'bg-green-100 text-green-700' },
  review: { label: '审核', cls: 'bg-purple-100 text-purple-700' },
  system: { label: '系统', cls: 'bg-gray-100 text-gray-700' },
}

const categoryOptions = [
  { value: '', label: '全部' },
  { value: 'query', label: '查询' },
  { value: 'transfer', label: '转移' },
  { value: 'claim', label: '申领' },
  { value: 'certify', label: '认证' },
  { value: 'review', label: '审核' },
  { value: 'system', label: '系统' },
]

const resultOptions = [
  { value: '', label: '全部' },
  { value: 'success', label: '成功' },
  { value: 'failure', label: '失败' },
]

const pageSizeOptions = [10, 20, 50]

export default function AuditLog() {
  const { currentRole, user, auditLogs } = useAppStore()
  const { logAction } = useAuditLog()
  const [category, setCategory] = useState('')
  const [result, setResult] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [testAction, setTestAction] = useState('')
  const [testCategory, setTestCategory] = useState<AuditLogEntry['category']>('query')

  const merged = useMemo(() => {
    const seen = new Set<string>()
    const combined: AuditLogEntry[] = []
    for (const log of auditLogs) {
      if (!seen.has(log.id)) {
        seen.add(log.id)
        combined.push(log)
      }
    }
    for (const log of mockAuditLogs) {
      if (!seen.has(log.id)) {
        seen.add(log.id)
        combined.push(log)
      }
    }
    return combined
  }, [auditLogs])

  const filtered = useMemo(() => {
    return merged.filter((log) => {
      if (currentRole !== 'agent' && user && log.operatorId !== user.id) return false
      if (category && log.category !== category) return false
      if (result && log.result !== result) return false
      if (dateFrom && log.timestamp < dateFrom) return false
      if (dateTo && log.timestamp > dateTo + ' 23:59:59') return false
      return true
    })
  }, [merged, currentRole, user, category, result, dateFrom, dateTo])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const resetFilters = () => {
    setCategory('')
    setResult('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleAddLog = () => {
    if (!testAction.trim()) return
    logAction(testAction.trim(), testCategory, '手动测试记录')
    setTestAction('')
  }

  return (
    <div className="min-h-screen bg-surface-primary p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">审计日志</h1>
          <p className="text-sm text-gray-500 mt-1">操作留痕 · 全程可追溯</p>
        </div>
        <button className="gov-btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          导出日志
        </button>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        操作留痕视图 - 所有操作均被自动记录，仅供本人和授权经办人员查看
      </div>

      {currentRole === 'agent' && (
        <div className="gov-card p-5">
          <h3 className="text-sm font-semibold text-gov-blue-dark mb-3">记录操作日志</h3>
          <div className="flex items-end gap-3">
            <div className="space-y-1 flex-1">
              <label className="text-xs text-gray-500">操作内容</label>
              <input
                value={testAction}
                onChange={(e) => setTestAction(e.target.value)}
                placeholder="输入操作内容"
                className="h-10 w-full border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:border-gov-blue"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">类型</label>
              <select
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value as AuditLogEntry['category'])}
                className="h-10 border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:border-gov-blue"
              >
                {categoryOptions.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button onClick={handleAddLog} className="gov-btn-primary text-sm px-5 h-10">
              记录
            </button>
          </div>
        </div>
      )}

      <div className="gov-card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">操作类型</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="h-10 border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:border-gov-blue"
            >
              {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">操作结果</label>
            <select
              value={result}
              onChange={(e) => { setResult(e.target.value); setPage(1) }}
              className="h-10 border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:border-gov-blue"
            >
              {resultOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">开始时间</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="h-10 border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:border-gov-blue"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">结束时间</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="h-10 border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:border-gov-blue"
            />
          </div>
          <button onClick={() => setPage(1)} className="gov-btn-primary flex items-center gap-1 text-sm">
            <Search className="w-4 h-4" />
            查询
          </button>
          <button onClick={resetFilters} className="gov-btn-secondary flex items-center gap-1 text-sm">
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gov-blue text-white">
                <th className="px-4 py-3 text-left font-medium">时间</th>
                <th className="px-4 py-3 text-left font-medium">操作人</th>
                <th className="px-4 py-3 text-left font-medium">操作类型</th>
                <th className="px-4 py-3 text-left font-medium">操作内容</th>
                <th className="px-4 py-3 text-left font-medium">目标</th>
                <th className="px-4 py-3 text-left font-medium">IP地址</th>
                <th className="px-4 py-3 text-left font-medium">结果</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((log, i) => {
                const cat = categoryMap[log.category]
                return (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-100 hover:bg-surface-hover transition-colors ${i % 2 === 1 ? 'bg-surface-secondary/40' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{log.operatorName}</td>
                    <td className="px-4 py-3">
                      <span className={`gov-badge ${cat.cls}`}>{cat.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.action}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{log.target}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip}</td>
                    <td className="px-4 py-3">
                      <span className={`gov-badge ${log.result === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.result === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">共 {total} 条记录</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">每页</label>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="h-8 border border-gray-300 rounded px-2 text-sm bg-white focus:outline-none focus:border-gov-blue"
              >
                {pageSizeOptions.map((s) => <option key={s} value={s}>{s}条</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
