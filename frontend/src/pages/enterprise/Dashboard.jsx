import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UsersIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline'
import { enterpriseAPI } from '../../api/client'

const EnterpriseDashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await enterpriseAPI.getDashboard()
        setDashboard(res.data)
      } catch (err) {
        setError('获取企业数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const stats = dashboard || {}
  const statCards = [
    { title: '员工总数', value: stats.totalEmployees || 0, icon: UsersIcon, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { title: '社保正常', value: stats.normalSS || 0, icon: ShieldCheckIcon, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
    { title: '社保停缴', value: stats.stoppedSS || 0, icon: ExclamationTriangleIcon, color: 'bg-red-50 text-red-600', iconBg: 'bg-red-100' },
    { title: '合规评分', value: `${stats.complianceScore || 0}分`, icon: ScaleIcon, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100' },
  ]

  const quickActions = [
    { label: '员工管理', path: '/enterprise/employees', icon: BuildingOfficeIcon, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: '合规巡检', path: '/enterprise/compliance', icon: ScaleIcon, color: 'bg-green-600 hover:bg-green-700' },
    { label: '预警中心', path: '/enterprise/alerts', icon: BellIcon, color: 'bg-red-600 hover:bg-red-700' },
    { label: '福利热力图', path: '/enterprise/heatmap', icon: ChartBarIcon, color: 'bg-purple-600 hover:bg-purple-700' },
  ]

  const riskDistribution = stats.riskDistribution || []
  const maxRisk = Math.max(...riskDistribution.map((r) => r.count || r.value || 0), 1)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">企业工作台</h2>

      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className={`${card.color} rounded-xl p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {riskDistribution.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">风险分布</h3>
          <div className="space-y-3">
            {riskDistribution.map((item, i) => {
              const count = item.count || item.value || 0
              const width = (count / maxRisk) * 100
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.level || item.name || item.category}</span>
                    <span className="text-gray-800 font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {stats.recentAlerts && stats.recentAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">最新预警</h3>
          <div className="space-y-3">
            {stats.recentAlerts.map((alert, i) => (
              <div key={alert.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon
                    className={`w-5 h-5 ${
                      alert.severity === 'danger' || alert.severity === 'high'
                        ? 'text-red-500'
                        : 'text-orange-500'
                    }`}
                  />
                  <span className="text-gray-700">{alert.title || alert.message}</span>
                </div>
                <span className="text-xs text-gray-400">{alert.createdAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnterpriseDashboard
