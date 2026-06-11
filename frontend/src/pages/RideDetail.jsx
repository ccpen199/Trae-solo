import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import api from '../utils/api'

export default function RideDetail() {
  const { id } = useParams()
  const [ride, setRide] = useState(null)
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('speed')

  useEffect(() => {
    loadRideData()
  }, [id])

  const loadRideData = async () => {
    try {
      const res = await api.get(`/rides/${id}`)
      setRide(res.data.ride)
      setPoints(res.data.points || [])
    } catch (err) {
      console.error('Failed to load ride data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分${secs}秒`
    }
    return `${minutes}分${secs}秒`
  }

  const chartData = points.map((p, idx) => ({
    index: idx + 1,
    time: new Date(p.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    speed: p.speed?.toFixed(1) || 0,
    altitude: p.altitude?.toFixed(0) || 0,
    slope: p.slope?.toFixed(2) || 0,
    battery_temp: p.battery_temp?.toFixed(1) || 0,
    battery_level: p.battery_level || 0
  }))

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  if (!ride) {
    return <div className="text-center py-20 text-gray-500">骑行记录不存在</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/rides" className="mr-4 text-gray-500 hover:text-gray-700">
            ← 返回列表
          </Link>
          <h2 className="text-xl font-semibold text-gray-800">骑行详情</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📏" label="骑行距离" value={`${ride.distance?.toFixed(2)} km`} />
        <StatCard icon="⏱️" label="骑行时长" value={formatDuration(ride.duration)} />
        <StatCard icon="🚀" label="平均速度" value={`${ride.avg_speed?.toFixed(1)} km/h`} />
        <StatCard icon="⚡" label="最高速度" value={`${ride.max_speed?.toFixed(1)} km/h`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="⛰️" label="海拔爬升" value={`${ride.elevation_gain?.toFixed(0)} m`} />
        <StatCard icon="🌡️" label="平均电池温度" value={`${ride.avg_battery_temp?.toFixed(1)} °C`} />
        <StatCard icon="🔥" label="最高电池温度" value={`${ride.max_battery_temp?.toFixed(1)} °C`} />
        <StatCard icon="🛴" label="设备" value={ride.model} />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-4">
            {[
              { id: 'speed', label: '速度曲线', icon: '🚀' },
              { id: 'elevation', label: '海拔剖面', icon: '⛰️' },
              { id: 'battery', label: '电池状态', icon: '🔋' },
              { id: 'slope', label: '坡度变化', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6" style={{ height: '350px' }}>
          {activeTab === 'speed' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" km/h" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="speed" stroke="#3b82f6" fill="#93c5fd" name="速度 (km/h)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'elevation' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" m" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="altitude" stroke="#10b981" fill="#6ee7b7" name="海拔 (m)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'battery' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} unit=" °C" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit=" %" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="battery_temp" stroke="#ef4444" strokeWidth={2} dot={false} name="电池温度 (°C)" />
                <Line yAxisId="right" type="monotone" dataKey="battery_level" stroke="#f59e0b" strokeWidth={2} dot={false} name="电池电量 (%)" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'slope' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" %" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="slope" stroke="#8b5cf6" fill="#c4b5fd" name="坡度 (%)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">骑行信息</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">开始时间</div>
            <div className="text-gray-800 font-medium mt-1">
              {new Date(ride.start_time).toLocaleString('zh-CN')}
            </div>
          </div>
          <div>
            <div className="text-gray-500">结束时间</div>
            <div className="text-gray-800 font-medium mt-1">
              {ride.end_time ? new Date(ride.end_time).toLocaleString('zh-CN') : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">起点</div>
            <div className="text-gray-800 font-medium mt-1 font-mono text-xs">
              {ride.start_lat?.toFixed(4)}, {ride.start_lng?.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">终点</div>
            <div className="text-gray-800 font-medium mt-1 font-mono text-xs">
              {ride.end_lat?.toFixed(4)}, {ride.end_lng?.toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}
