import React, { useState, useEffect } from 'react'
import { useAuth } from '../App.jsx'
import api from '../utils/api'

export default function UserCenter() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [ridesRes, devicesRes] = await Promise.all([
        api.get('/rides?page_size=100'),
        api.get('/devices')
      ])

      const rides = ridesRes.data.rides || []
      const devices = devicesRes.data.devices || []
      const totalDistance = rides.reduce((sum, r) => sum + (r.distance || 0), 0)
      const totalDuration = rides.reduce((sum, r) => sum + (r.duration || 0), 0)
      const activeDevices = devices.filter(d => d.status === 'active').length

      setStats({
        totalRides: ridesRes.data.total || 0,
        totalDistance: totalDistance.toFixed(1),
        totalDuration: Math.floor(totalDuration / 60),
        totalDevices: devices.length,
        activeDevices
      })
    } catch (err) {
      console.error('Failed to load user stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const roleMap = {
    admin: { label: '管理员', color: 'text-red-600 bg-red-100' },
    user: { label: '普通用户', color: 'text-blue-600 bg-blue-100' }
  }

  const roleInfo = roleMap[user?.role] || roleMap.user

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl">
            {user?.nickname?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div className="ml-5">
            <h2 className="text-2xl font-bold">
              {user?.nickname || user?.username}
            </h2>
            <div className="flex items-center mt-2">
              <span className={`px-2.5 py-1 rounded text-sm font-medium ${roleInfo.color.replace('text-', 'text-white/').replace('bg-', 'bg-white/')} bg-white/20`}>
                {roleInfo.label}
              </span>
              <span className="ml-3 text-primary-100 text-sm">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800">{stats?.totalRides || 0}</div>
          <div className="text-sm text-gray-500 mt-1">骑行次数</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800">{stats?.totalDistance || 0}</div>
          <div className="text-sm text-gray-500 mt-1">总里程 (km)</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800">{stats?.totalDuration || 0}</div>
          <div className="text-sm text-gray-500 mt-1">总时长 (分钟)</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-primary-600">{user?.n_coins || 0}</div>
          <div className="text-sm text-gray-500 mt-1">N币余额</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">账户信息</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500">用户名</span>
              <span className="text-gray-800 font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500">昵称</span>
              <span className="text-gray-800 font-medium">{user?.nickname || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500">邮箱</span>
              <span className="text-gray-800 font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500">角色</span>
              <span className={`px-2.5 py-1 rounded text-sm font-medium ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-500">设备数量</span>
              <span className="text-gray-800 font-medium">{stats?.totalDevices || 0} 台</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">我的设备概览</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">已激活设备</span>
                <span className="font-semibold text-green-600">{stats?.activeDevices || 0} 台</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">未激活设备</span>
                <span className="font-semibold text-gray-500">
                  {(stats?.totalDevices || 0) - (stats?.activeDevices || 0)} 台
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500 mb-2">激活率</div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: stats?.totalDevices
                        ? `${(stats.activeDevices / stats.totalDevices) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">安全设置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-800">修改密码</div>
            <div className="text-sm text-gray-500 mt-1">定期更换密码保护账户安全</div>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-800">绑定手机</div>
            <div className="text-sm text-gray-500 mt-1">绑定手机号接收通知</div>
          </button>
        </div>
      </div>
    </div>
  )
}
