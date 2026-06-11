import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'

export default function DeviceDetail() {
  const { vin } = useParams()
  const [device, setDevice] = useState(null)
  const [otaTasks, setOtaTasks] = useState([])
  const [availableFirmware, setAvailableFirmware] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    loadDeviceData()
  }, [vin])

  const loadDeviceData = async () => {
    try {
      const [deviceRes, otaRes, firmwareRes] = await Promise.all([
        api.get(`/devices/${vin}`),
        api.get(`/devices/${vin}/ota/tasks`),
        api.get(`/devices/${vin}/ota/available`)
      ])
      setDevice(deviceRes.data.device)
      setOtaTasks(otaRes.data.tasks || [])
      setAvailableFirmware(firmwareRes.data)
    } catch (err) {
      console.error('Failed to load device data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (upgrading) return
    setUpgrading(true)
    try {
      await api.post(`/devices/${vin}/ota/upgrade`)
      setTimeout(() => {
        loadDeviceData()
        setUpgrading(false)
      }, 3000)
    } catch (err) {
      alert(err.response?.data?.error || '升级失败')
      setUpgrading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  if (!device) {
    return <div className="text-center py-20 text-gray-500">设备不存在</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/devices" className="mr-4 text-gray-500 hover:text-gray-700">
            ← 返回
          </Link>
          <h2 className="text-xl font-semibold text-gray-800">设备详情</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start">
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-4xl">
                🛴
              </div>
              <div className="ml-5 flex-1">
                <h3 className="text-xl font-semibold text-gray-800">{device.model}</h3>
                <p className="text-gray-500 font-mono text-sm mt-1">VIN: {device.vin}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    device.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {device.status === 'active' ? '已激活' : '未激活'}
                  </span>
                  <span className="text-sm text-gray-500">
                    固件版本: {device.firmware_version}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard icon="🔋" label="电池电量" value={`${device.battery_level}%`} sub={device.battery_level > 50 ? '状态良好' : '建议充电'} />
            <InfoCard icon="📏" label="累计里程" value={`${device.mileage?.toFixed(1)} km`} sub="总行驶里程" />
            <InfoCard icon="⚡" label="固件版本" value={device.firmware_version} sub="当前版本" />
            <InfoCard icon="📅" label="激活时间" value={device.activated_at ? new Date(device.activated_at).toLocaleDateString() : '未激活'} sub={device.activated_at ? '已激活' : '待激活'} />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">电池状态</h4>
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  device.battery_level > 50 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  device.battery_level > 20 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                  'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${device.battery_level}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white drop-shadow">
                {device.battery_level}%
              </div>
            </div>
            <div className="flex justify-between mt-3 text-sm text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">固件升级</h4>
            {availableFirmware?.available ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🔄</span>
                    <div>
                      <div className="font-medium text-blue-800">有新版本可用</div>
                      <div className="text-sm text-blue-600">
                        {device.firmware_version} → {availableFirmware.firmware?.version}
                      </div>
                    </div>
                  </div>
                  {availableFirmware.firmware?.changelog && (
                    <div className="mt-3 text-sm text-blue-700">
                      <div className="font-medium mb-1">更新内容：</div>
                      <p>{availableFirmware.firmware.changelog}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {upgrading ? '升级中...' : '立即升级'}
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-gray-600">已是最新版本</div>
                <div className="text-sm text-gray-400 mt-1">{device.firmware_version}</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">升级记录</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
              {otaTasks.length > 0 ? (
                otaTasks.map(task => (
                  <div key={task.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      task.status === 'completed' ? 'bg-green-100 text-green-600' :
                      task.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.status === 'completed' ? '✓' :
                       task.status === 'failed' ? '✕' : '⏳'}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        版本升级
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(task.started_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{task.progress}%</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无升级记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  )
}
