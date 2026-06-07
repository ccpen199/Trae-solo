import { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, X, Loader2, Calendar, User, FileText, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AuditLog {
  id: number
  user_id: number
  user_name: string
  action: string
  resource_type: string
  resource_id: number | null
  detail: any
  ip: string | null
  created_at: string
}

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  login: '登录',
  logout: '登出',
  update_status: '更新状态',
  update_node: '更新节点',
  verify: '审核',
  certify: '认证',
  settle: '结算',
  update_rules: '更新规则',
  add_member: '添加成员',
  change_role: '调整角色',
  followup: '跟进',
}

const resourceTypeLabels: Record<string, string> = {
  user: '用户',
  house: '房源',
  client: '客户',
  transaction: '交易',
  transaction_node: '交易节点',
  commission: '佣金',
  commission_rule: '佣金规则',
  organization: '组织',
  schedule: '日程',
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    userId: '',
    startDate: '',
    endDate: '',
  })
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const result = await api.get<AuditLog[]>('/audit/logs', {
        ...filters,
        page,
        pageSize,
      })
      if (result.success && result.data) {
        setLogs(result.data || [])
        setTotal(result.total || 0)
      } else {
        console.error('获取审计日志失败:', result.error)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const result = await api.get<any[]>('/organizations/members', { pageSize: 100 })
      if (result.success && result.data) {
        setUsers(result.data?.map(u => ({ id: u.id, name: u.name })) || [])
      } else {
        console.error('获取用户列表失败:', result.error)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [filters, page])

  const handleViewDetail = async (logId: number) => {
    setLoadingDetail(true)
    try {
      const result = await api.get<AuditLog>(`/audit/logs/${logId}`)
      if (result.success && result.data) {
        setDetailLog(result.data)
      } else {
        console.error('获取日志详情失败:', result.error)
      }
    } catch (err) {
      console.error('Failed to fetch log detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['时间', '用户', '操作', '资源类型', '资源ID', 'IP地址'].join(','),
      ...logs.map(log => [
        log.created_at,
        log.user_name,
        actionLabels[log.action] || log.action,
        resourceTypeLabels[log.resource_type] || log.resource_type,
        log.resource_id || '',
        log.ip || '',
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>
            <p className="text-gray-500 mt-1">查看系统操作记录</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">筛选条件</span>
              </div>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">全部操作</option>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">全部资源类型</option>
                {Object.entries(resourceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">全部用户</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资源类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资源ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">暂无日志记录</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {formatDateTime(log.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-900 font-medium">{log.user_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {actionLabels[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                              {resourceTypeLabels[log.resource_type] || log.resource_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {log.resource_id || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                            {log.ip || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleViewDetail(log.id)}
                              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              详情
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    共 {total} 条记录，第 {page} / {totalPages} 页
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {detailLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">日志详情</h3>
                <button
                  onClick={() => setDetailLog(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">操作时间</label>
                        <p className="font-medium text-gray-900 mt-1">{formatDateTime(detailLog.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">操作用户</label>
                        <p className="font-medium text-gray-900 mt-1">{detailLog.user_name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">操作类型</label>
                        <p className="font-medium text-gray-900 mt-1">
                          {actionLabels[detailLog.action] || detailLog.action}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">资源类型</label>
                        <p className="font-medium text-gray-900 mt-1">
                          {resourceTypeLabels[detailLog.resource_type] || detailLog.resource_type}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">资源ID</label>
                        <p className="font-medium text-gray-900 mt-1">{detailLog.resource_id || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">IP地址</label>
                        <p className="font-medium text-gray-900 mt-1 font-mono">{detailLog.ip || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">详细信息</label>
                      <pre className="mt-2 p-4 bg-gray-50 rounded-lg overflow-x-auto text-sm text-gray-700 border border-gray-200">
                        {detailLog.detail ? JSON.stringify(detailLog.detail, null, 2) : '无详细信息'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
