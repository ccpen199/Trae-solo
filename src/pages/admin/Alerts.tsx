import { useAdminStore } from '@/stores/adminStore'
import StatusBadge from '@/components/StatusBadge'
import { AlertTriangle, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'

const typeLabels: Record<string, string> = {
  high_frequency: '高频重复认证',
  remote_cluster: '异地集中认证',
  face_mismatch: '人脸不匹配',
}

export default function Alerts() {
  const { alerts, fetchAlerts, processAlert, loading } = useAdminStore()
  const [filterType, setFilterType] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filterType) params.type = filterType
    if (filterLevel) params.level = filterLevel
    if (filterStatus) params.status = filterStatus
    fetchAlerts(params)
  }, [fetchAlerts, filterType, filterLevel, filterStatus])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={18} className="text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-badge px-3 py-2 text-sm bg-white"
        >
          <option value="">全部类型</option>
          <option value="high_frequency">高频重复认证</option>
          <option value="remote_cluster">异地集中认证</option>
          <option value="face_mismatch">人脸不匹配</option>
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="border border-gray-200 rounded-badge px-3 py-2 text-sm bg-white"
        >
          <option value="">全部等级</option>
          <option value="critical">严重</option>
          <option value="warning">警告</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-badge px-3 py-2 text-sm bg-white"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processed">已处理</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">加载中...</div>
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">预警类型</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">预警等级</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">证件号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">详情</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">触发时间</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-accent" />
                        {typeLabels[alert.type] || alert.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={alert.level === 'critical' ? 'error' : 'warning'}
                        text={alert.level === 'critical' ? '严重' : '警告'}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{alert.idCard}</td>
                    <td className="px-4 py-3">{alert.detail}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{alert.triggeredAt}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={alert.status === 'processed' ? 'success' : 'pending'}
                        text={alert.status === 'processed' ? '已处理' : '待处理'}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {alert.status === 'pending' ? (
                        <button
                          onClick={() => processAlert(alert.id)}
                          className="px-3 py-1 bg-primary text-white text-xs rounded-badge hover:bg-primary/90 transition-colors"
                        >
                          处理
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
