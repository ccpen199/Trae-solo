import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../App.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentRides, setRecentRides] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ridesRes, devicesRes] = await Promise.all([
        api.get('/rides?page_size=5'),
        api.get('/devices')
      ])
      setRecentRides(ridesRes.data.rides || [])
      setDevices(devicesRes.data.devices || [])

      const activeDevices = devicesRes.data.devices?.filter(d => d.status === 'active') || []
      const totalDistance = (ridesRes.data.rides || []).reduce((sum, r) => sum + (r.distance || 0), 0)
      const totalDuration = (ridesRes.data.rides || []).reduce((sum, r) => sum + (r.duration || 0), 0)

      setStats({
        devices: devicesRes.data.devices?.length || 0,
        activeDevices: activeDevices.length,
        totalRides: ridesRes.data.total || 0,
        totalDistance: totalDistance.toFixed(1),
        totalDuration: Math.floor(totalDuration / 60),
        nCoins: user?.n_coins || 0
      })
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">欢迎回来，{user?.nickname || user?.username}！</h1>
            <p className="text-primary-100 mt-1">今天也要安全出行哦 🛴</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{user?.n_coins || 0}</div>
            <div className="text-primary-200 text-sm">N币余额</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon="🛴" label="我的设备" value={stats?.devices || 0} color="blue" />
        <StatCard icon="✅" label="已激活" value={stats?.activeDevices || 0} color="green" />
        <StatCard icon="📍" label="骑行次数" value={stats?.totalRides || 0} color="purple" />
        <StatCard icon="📏" label="总里程" value={`${stats?.totalDistance || 0} km`} color="orange" />
        <StatCard icon="⏱️" label="总时长" value={`${stats?.totalDuration || 0} 分`} color="pink" />
        <StatCard icon="💰" label="N币" value={stats?.nCoins || 0} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">搜索筛选中心</h3>
            <Link to="/shop" className="text-sm text-primary-600 hover:text-primary-700">进入分类发现 →</Link>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              placeholder="搜索设备、订单、话题或商城商品"
            />
            <div className="flex gap-2">
              {['整车', '配件', '维修', '社区'].map(item => (
                <Link
                  to={item === '社区' ? '/social' : item === '维修' ? '/service' : '/shop'}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary-50 hover:text-primary-700"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-red-800">后台管理入口</h3>
          <p className="text-sm text-red-600 mt-1">用户管理、设备管理、内容审核、工单与固件管理</p>
          <Link to="/admin" className="inline-flex mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            打开管理后台
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">我的设备</h3>
            <Link to="/devices" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {devices.slice(0, 3).map(device => (
              <div key={device.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                  🛴
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-800">{device.model}</div>
                  <div className="text-xs text-gray-500">VIN: {device.vin}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    device.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {device.status === 'active' ? '已激活' : '未激活'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">电量 {device.battery_level}%</div>
                </div>
              </div>
            ))}
            {devices.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                暂无设备，快去激活吧！
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">最近骑行</h3>
            <Link to="/rides" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentRides.map(ride => (
              <div key={ride.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  📍
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(ride.start_time).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDuration(ride.duration)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{ride.distance?.toFixed(2)} km</div>
                  <div className="text-xs text-gray-500">平均 {ride.avg_speed?.toFixed(1)} km/h</div>
                </div>
              </div>
            ))}
            {recentRides.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                暂无骑行记录
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/fences" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🚧</div>
          <div className="font-medium text-gray-800">电子围栏</div>
          <div className="text-sm text-gray-500 mt-1">禁行区·限速区</div>
        </Link>
        <Link to="/service" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🔧</div>
          <div className="font-medium text-gray-800">服务支持</div>
          <div className="text-sm text-gray-500 mt-1">维修·备件·工单</div>
        </Link>
        <Link to="/shop" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🛒</div>
          <div className="font-medium text-gray-800">商城</div>
          <div className="text-sm text-gray-500 mt-1">整车·配件·N币</div>
        </Link>
        <Link to="/social" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">👥</div>
          <div className="font-medium text-gray-800">社区</div>
          <div className="text-sm text-gray-500 mt-1">路线·俱乐部·话题</div>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    pink: 'bg-pink-50 text-pink-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center text-xl mb-2`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}
