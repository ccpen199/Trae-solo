import { useState, useEffect, useCallback } from 'react'
import { Filter, Clock, Globe, CheckCircle, XCircle, ChevronDown, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { AuditLog } from '../../shared/types'

const MODULES = ['全部', '登录', '证照', '健康码', '户籍', '社保', '设置']
const TIME_RANGES = [
  { label: '全部', value: '' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
]

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [module, setModule] = useState('全部')
  const [timeRange, setTimeRange] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showModuleDrop, setShowModuleDrop] = useState(false)
  const [showTimeDrop, setShowTimeDrop] = useState(false)

  const fetchLogs = useCallback(async (p: number, reset = false) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, limit: 15 }
      if (module !== '全部') params.module = module
      if (timeRange) params.timeRange = timeRange
      const res = await api.get<AuditLog[]>('/audit/logs', { params })
      const newData = res.data
      setLogs((prev) => (reset ? newData : [...prev, ...newData]))
      setHasMore(newData.length >= 15)
    } catch { /* ignore */ }
    setLoading(false)
  }, [module, timeRange])

  useEffect(() => {
    setPage(1)
    fetchLogs(1, true)
  }, [module, timeRange, fetchLogs])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchLogs(next)
  }

  const closeDropdowns = () => {
    setShowModuleDrop(false)
    setShowTimeDrop(false)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn" onClick={closeDropdowns}>
      <h1 className="text-xl font-bold text-text-dark mb-4">操作留痕审计</h1>

      <div className="flex gap-3 mb-4 relative">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowModuleDrop(!showModuleDrop); setShowTimeDrop(false) }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-text-dark"
          >
            <Filter className="w-4 h-4 text-primary" />
            {module}
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>
          {showModuleDrop && (
            <div className="absolute top-full mt-1 left-0 bg-white rounded-xl shadow-lg border z-10 py-1 w-28 animate-fadeIn">
              {MODULES.map((m) => (
                <button
                  key={m}
                  onClick={() => { setModule(m); setShowModuleDrop(false) }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${module === m ? 'text-primary font-medium' : 'text-text-dark'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowTimeDrop(!showTimeDrop); setShowModuleDrop(false) }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-text-dark"
          >
            <Clock className="w-4 h-4 text-primary" />
            {TIME_RANGES.find((t) => t.value === timeRange)?.label || '时间范围'}
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>
          {showTimeDrop && (
            <div className="absolute top-full mt-1 left-0 bg-white rounded-xl shadow-lg border z-10 py-1 w-28 animate-fadeIn">
              {TIME_RANGES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTimeRange(t.value); setShowTimeDrop(false) }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${timeRange === t.value ? 'text-primary font-medium' : 'text-text-dark'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-3 animate-slideUp">
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              log.result === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {log.result === 'success'
                ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                : <XCircle className="w-3.5 h-3.5 text-red-500" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text-dark truncate">{log.action}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  log.result === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {log.result === 'success' ? '成功' : '失败'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded">{log.module}</span>
                <span>{log.time}</span>
                <span className="flex items-center gap-0.5"><Globe className="w-3 h-3" />{log.ip}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 && !loading && (
        <div className="text-center py-16 text-text-muted">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>暂无操作记录</p>
        </div>
      )}

      {hasMore && logs.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white rounded-xl shadow-sm text-sm text-primary hover:shadow-md transition-shadow disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}
