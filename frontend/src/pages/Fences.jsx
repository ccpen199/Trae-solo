import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Fences() {
  const [fences, setFences] = useState([])
  const [parkingSpots, setParkingSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('fences')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [fencesRes, parkingRes] = await Promise.all([
        api.get('/fences/fences'),
        api.get('/fences/parking')
      ])
      setFences(fencesRes.data.fences || [])
      setParkingSpots(parkingRes.data.spots || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckin = async (spotId) => {
    try {
      await api.post(`/fences/parking/${spotId}/checkin`)
      loadData()
      alert('停车打卡成功！')
    } catch (err) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleCheckout = async (spotId) => {
    try {
      await api.post(`/fences/parking/${spotId}/checkout`)
      loadData()
      alert('取车成功！')
    } catch (err) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-1 inline-flex shadow-sm">
        <button
          onClick={() => setActiveTab('fences')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'fences' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'
          }`}
        >
          🚧 电子围栏
        </button>
        <button
          onClick={() => setActiveTab('parking')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'parking' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'
          }`}
        >
          🅿️ 停车点
        </button>
      </div>

      {activeTab === 'fences' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h4 className="font-medium text-yellow-800">温馨提示</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  请遵守各地电子围栏规定，禁行区域禁止骑行，限速区域请控制车速。违规可能导致车辆限速或账户处罚。
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fences.map(fence => (
              <div key={fence.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      fence.type === 'forbidden' ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      {fence.type === 'forbidden' ? '🚫' : '🚧'}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-800">{fence.name}</h4>
                      <p className="text-sm text-gray-500">{fence.city}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    fence.type === 'forbidden'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {fence.type === 'forbidden' ? '禁行区' : '限速区'}
                  </span>
                </div>

                {fence.description && (
                  <p className="text-sm text-gray-600 mt-3">{fence.description}</p>
                )}

                {fence.type === 'speed_limit' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">限速</span>
                      <span className="text-xl font-bold text-orange-600">{fence.speed_limit} km/h</span>
                    </div>
                  </div>
                )}

                {fence.type === 'forbidden' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-red-600 text-sm">
                      <span>🚫</span>
                      <span className="ml-2">禁止通行，请勿进入</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'parking' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parkingSpots.map(spot => (
              <div key={spot.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                    🅿️
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-semibold text-gray-800">{spot.name}</h4>
                    <p className="text-sm text-gray-500">{spot.city} · {spot.address}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">车位状态</span>
                    <span className={`text-sm font-medium ${
                      spot.available > spot.capacity * 0.3 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {spot.available} / {spot.capacity} 可用
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        spot.available > spot.capacity * 0.3 ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${(spot.available / spot.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleCheckin(spot.id)}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                  >
                    停车打卡
                  </button>
                  <button
                    onClick={() => handleCheckout(spot.id)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    取车离开
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
