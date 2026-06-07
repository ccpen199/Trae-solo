import React, { useState, useEffect } from 'react'
import { ClipboardDocumentListIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { adminAPI } from '../../api/client'

const actionOptions = [
  { value: '', label: '全部操作' },
  { value: 'login', label: '登录' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'purchase', label: '购买' },
  { value: 'scan', label: '扫描' },
  { value: 'calculate', label: '计算' },
]

const Audit = () => {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, actionFilter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (actionFilter) params.action = actionFilter
      const res = await adminAPI.getAuditLogs(params)
      setLogs(res.data?.items || res.data?.logs || res.data || [])
      if (res.data?.total !== undefined) {
        setPagination((prev) => ({ ...prev, total: res.data.total }))
      }
    } catch (err) {
      setError('获取审计日志失败')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">审计日志</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <FunnelIcon className="w-5 h-5 text-gray-400" />
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          {actionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">时间</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">用户</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">操作</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">目标</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">详情</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">水印</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-500 text-xs">{log.createdAt}</td>
                <td className="px-5 py-3 text-gray-700">{log.userName || log.user || '-'}</td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700">{log.target || log.resource || '-'}</td>
                <td className="px-5 py-3 text-gray-500 text-xs max-w-xs truncate">{log.details || log.description || '-'}</td>
                <td className="px-5 py-3 text-gray-400 text-xs font-mono">{log.watermark || log.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= totalPages}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

export default Audit
