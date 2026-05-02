import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'

interface Alert {
  id: string
  alert_type: string
  title: string
  message: string
  severity: string
  status: string
  raised_at: string
  resolved_at: string
  resolved_by: string
}

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', severity: '' })

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      const params: Record<string, string> = {}
      if (filter.status) params.status = filter.status
      if (filter.severity) params.severity = filter.severity
      
      const response = await adminApi.getAlerts(params)
      setAlerts(response.data || [])
    } catch (error) {
      console.error('获取告警列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const map: Record<string, { class: string; text: string }> = {
      critical: { class: 'badge-danger', text: '严重' },
      high: { class: 'badge-warning', text: '高' },
      medium: { class: 'badge-info', text: '中' },
      low: { class: 'badge-success', text: '低' },
    }
    return map[severity] || { class: 'badge-gray', text: severity }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; text: string }> = {
      active: { class: 'badge-danger', text: '活跃' },
      acknowledged: { class: 'badge-warning', text: '已确认' },
      resolved: { class: 'badge-success', text: '已解决' },
    }
    return map[status] || { class: 'badge-gray', text: status }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      await adminApi.acknowledgeAlert(alertId)
      fetchAlerts()
    } catch (error) {
      console.error('确认告警失败', error)
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      await adminApi.resolveAlert(alertId)
      fetchAlerts()
    } catch (error) {
      console.error('解决告警失败', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">合规告警</h1>
        <p className="text-gray-500 mt-1">监控系统合规风险和异常告警</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">状态</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="select-field w-32"
            >
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="acknowledged">已确认</option>
              <option value="resolved">已解决</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">严重程度</label>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="select-field w-32"
            >
              <option value="">全部级别</option>
              <option value="critical">严重</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-gray-500">暂无告警记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <span className={`badge ${getSeverityBadge(alert.severity).class}`}>
                      {getSeverityBadge(alert.severity).text}
                    </span>
                    <span className={`badge ${getStatusBadge(alert.status).class}`}>
                      {getStatusBadge(alert.status).text}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{alert.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>告警类型: {alert.alert_type}</span>
                    <span>触发时间: {new Date(alert.raised_at).toLocaleString('zh-CN')}</span>
                    {alert.resolved_at && (
                      <span>解决时间: {new Date(alert.resolved_at).toLocaleString('zh-CN')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="btn-outline text-sm px-3 py-1"
                    >
                      确认
                    </button>
                  )}
                  {(alert.status === 'active' || alert.status === 'acknowledged') && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      解决
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
