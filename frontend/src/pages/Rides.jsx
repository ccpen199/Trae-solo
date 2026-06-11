import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function Rides() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    loadRides()
  }, [page])

  const loadRides = async () => {
    try {
      const res = await api.get(`/rides?page=${page}&page_size=${pageSize}`)
      setRides(res.data.rides || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error('Failed to load rides:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}小时${minutes}分`
    }
    return `${minutes}分${secs}秒`
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800">{total}</div>
          <div className="text-sm text-gray-500 mt-1">总骑行次数</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800">
            {rides.reduce((sum, r) => sum + (r.distance || 0), 0).toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 mt-1">本页总里程 (km)</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800">
            {rides.length > 0 
              ? (rides.reduce((sum, r) => sum + (r.avg_speed || 0), 0) / rides.length).toFixed(1)
              : 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">平均速度 (km/h)</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">骑行记录</h3>
        </div>

        {rides.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {rides.map(ride => (
              <Link
                key={ride.id}
                to={`/rides/${ride.id}`}
                className="flex items-center p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl">
                  📍
                </div>
                <div className="ml-4 flex-1">
                  <div className="font-medium text-gray-800">
                    {new Date(ride.start_time).toLocaleString('zh-CN')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {ride.vin} · {ride.model}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-800">
                    {ride.distance?.toFixed(2)} km
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDuration(ride.duration)}
                  </div>
                </div>
                <div className="ml-6 text-gray-400">→</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📍</div>
            <p>暂无骑行记录</p>
            <p className="text-sm mt-2">开始您的第一次骑行吧！</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
