import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [devices, setDevices] = useState([])
  const [pendingTopics, setPendingTopics] = useState([])
  const [serviceOrders, setServiceOrders] = useState([])
  const [firmwares, setFirmwares] = useState([])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'overview') {
        const res = await api.get('/admin/stats')
        setStats(res.data.stats)
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users')
        setUsers(res.data.users || [])
      } else if (activeTab === 'devices') {
        const res = await api.get('/admin/devices')
        setDevices(res.data.devices || [])
      } else if (activeTab === 'topics') {
        const res = await api.get('/admin/topics/pending')
        setPendingTopics(res.data.topics || [])
      } else if (activeTab === 'service') {
        const res = await api.get('/admin/service-orders')
        setServiceOrders(res.data.orders || [])
      } else if (activeTab === 'firmware') {
        const res = await api.get('/admin/firmware')
        setFirmwares(res.data.firmwares || [])
      }
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  const approveTopic = async (id) => {
    try {
      await api.put(`/admin/topics/${id}/approve`)
      loadData()
    } catch (err) {
      console.error('Failed to approve topic:', err)
    }
  }

  const rejectTopic = async (id) => {
    try {
      await api.put(`/admin/topics/${id}/reject`)
      loadData()
    } catch (err) {
      console.error('Failed to reject topic:', err)
    }
  }

  const tabs = [
    { id: 'overview', label: '数据总览', icon: '📊' },
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'devices', label: '设备管理', icon: '🛴' },
    { id: 'firmware', label: '固件管理', icon: '⚡' },
    { id: 'topics', label: '内容审核', icon: '✅' },
    { id: 'service', label: '工单管理', icon: '🔧' }
  ]

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-800">管理后台</h3>
            <p className="text-sm text-red-700">您正在访问管理功能，请谨慎操作</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-red-100 text-red-700'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="用户总数" value={stats.user_count} icon="👥" color="blue" />
            <StatCard label="设备总数" value={stats.device_count} icon="🛴" color="green" />
            <StatCard label="激活设备" value={stats.active_device_count} icon="✅" color="purple" />
            <StatCard label="骑行次数" value={stats.ride_count} icon="📍" color="orange" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="订单总数" value={stats.order_count} icon="📦" color="pink" />
            <StatCard label="总营收" value={`¥${stats.total_revenue?.toFixed(2) || 0}`} icon="💰" color="yellow" />
            <StatCard label="待审核话题" value={stats.pending_topics} icon="⏳" color="red" />
            <StatCard label="N币总量" value={stats.total_ncoins} icon="🪙" color="amber" />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">用户列表</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N币</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm">
                          {user.nickname?.[0] || user.username?.[0]}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.nickname}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.n_coins}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">设备列表</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIN码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">型号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">固件版本</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">所有者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">里程</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {devices.map(device => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{device.vin}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.model}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        device.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {device.status === 'active' ? '已激活' : '未激活'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.firmware_version}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.owner_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{device.mileage?.toFixed(1)} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'firmware' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">固件版本管理</h3>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              + 发布新版本
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">版本号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">适用机型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">大小</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">是否强制</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发布时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {firmwares.map(fw => (
                  <tr key={fw.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{fw.version}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fw.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {fw.size ? `${(fw.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fw.is_forced ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {fw.is_forced ? '强制更新' : '可选更新'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(fw.released_at).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">待审核话题 ({pendingTopics.length})</h3>
          </div>
          {pendingTopics.length > 0 ? (
            pendingTopics.map(topic => (
              <div key={topic.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      {topic.nickname || topic.username} 发布
                    </div>
                    <h4 className="font-semibold text-gray-800">{topic.title}</h4>
                    <p className="text-sm text-gray-600 mt-2">{topic.content}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveTopic(topic.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      ✓ 通过
                    </button>
                    <button
                      onClick={() => rejectTopic(topic.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                    >
                      ✕ 拒绝
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-400 bg-white rounded-xl">
              <div className="text-5xl mb-4">✅</div>
              <p>暂无待审核内容</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'service' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">维修工单</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">维修网点</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serviceOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.model}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.shop_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('zh-CN')}
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

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    pink: 'bg-pink-50 text-pink-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600'
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center text-xl mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
