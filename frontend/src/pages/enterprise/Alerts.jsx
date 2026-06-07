import React, { useState, useEffect } from 'react'
import {
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { enterpriseAPI } from '../../api/client'

const severityConfig = {
  danger: { label: '严重', color: 'bg-red-100 text-red-700', iconColor: 'text-red-500' },
  high: { label: '严重', color: 'bg-red-100 text-red-700', iconColor: 'text-red-500' },
  warning: { label: '警告', color: 'bg-orange-100 text-orange-700', iconColor: 'text-orange-500' },
  medium: { label: '警告', color: 'bg-orange-100 text-orange-700', iconColor: 'text-orange-500' },
  low: { label: '提示', color: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-500' },
  info: { label: '提示', color: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-500' },
}

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter === 'unread') params.isRead = false
      if (filter === 'read') params.isRead = true
      const res = await enterpriseAPI.getAlerts(params.isRead)
      setAlerts(res.data || [])
    } catch (err) {
      setError('获取预警列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await enterpriseAPI.markAlertRead(id)
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      )
    } catch (err) {
      setError('标记失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">预警中心</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex items-center gap-2">
        <FunnelIcon className="w-5 h-5 text-gray-400" />
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? '全部' : f === 'unread' ? '未读' : '已读'}
          </button>
        ))}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16">
          <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">暂无预警</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const severity = alert.severity || alert.level || 'info'
            const config = severityConfig[severity] || severityConfig.info
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-5 transition-colors ${
                  alert.isRead ? 'border-gray-100 opacity-70' : 'border-l-4 border-l-red-400 border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{alert.title || alert.message}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      {alert.description && (
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{alert.createdAt}</p>
                    </div>
                  </div>
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      标记已读
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Alerts
