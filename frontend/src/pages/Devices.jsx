import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function Devices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [vinInput, setVinInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      const res = await api.get('/devices')
      setDevices(res.data.devices || [])
    } catch (err) {
      console.error('Failed to load devices:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/devices/activate', { vin: vinInput })
      setShowActivateModal(false)
      setVinInput('')
      loadDevices()
    } catch (err) {
      setError(err.response?.data?.error || '激活失败')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">我的设备</h2>
        <button
          onClick={() => setShowActivateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 激活设备
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <Link
            key={device.id}
            to={`/devices/${device.vin}`}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center text-3xl">
                🛴
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                device.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {device.status === 'active' ? '已激活' : '未激活'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">{device.model}</h3>
            <p className="text-sm text-gray-500 mt-1 font-mono">VIN: {device.vin}</p>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">{device.battery_level}%</div>
                <div className="text-xs text-gray-500">电量</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">{device.mileage?.toFixed(0)}</div>
                <div className="text-xs text-gray-500">里程(km)</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">{device.firmware_version}</div>
                <div className="text-xs text-gray-500">固件</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">电池电量</span>
                <span className="text-gray-700">{device.battery_level}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    device.battery_level > 50 ? 'bg-green-500' :
                    device.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${device.battery_level}%` }}
                />
              </div>
            </div>
          </Link>
        ))}

        {devices.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🛴</div>
            <p>暂无设备，点击右上角激活您的设备</p>
          </div>
        )}
      </div>

      {showActivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">激活设备</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleActivate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  设备VIN码
                </label>
                <input
                  type="text"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value)}
                  placeholder="请输入设备VIN码"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
              <div className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">测试VIN码：</p>
                <p className="font-mono text-xs">SMART001SCOOTER0002</p>
                <p className="font-mono text-xs">SMART003WHEEL0004</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowActivateModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  激活
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
