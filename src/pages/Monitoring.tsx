import { useEffect, useState } from 'react'
import { AlertTriangle, MapPin, Gauge, Clock, CheckCircle, XCircle, Loader2, Search, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { format } from 'date-fns'

interface Alert {
  id: number
  rider_id: number
  order_id: number | null
  alert_type: string
  severity: string
  message: string | null
  resolved: number
  resolved_at: string | null
  created_at: string
  rider_name: string
  rider_phone: string
  order_no: string | null
}

interface Track {
  id: number
  rider_id: number
  order_id: number | null
  latitude: number
  longitude: number
  speed: number
  heading: number
  recorded_at: string
  rider_name: string
  order_no: string | null
}

interface DeviationResult {
  distance_from_pickup_meters: number
  distance_from_delivery_meters: number
  deviation_threshold_meters: number
  is_deviated: boolean
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

const severityLabels: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '信息',
}

const alertTypeLabels: Record<string, string> = {
  gps_deviation: 'GPS偏移',
  arrived_not_picked: '到达未取货',
  fake_signin: '虚假签到',
  timeout_risk: '超时风险',
}

const alertTypeColors: Record<string, string> = {
  gps_deviation: 'bg-purple-100 text-purple-800',
  arrived_not_picked: 'bg-orange-100 text-orange-800',
  fake_signin: 'bg-pink-100 text-pink-800',
  timeout_risk: 'bg-indigo-100 text-indigo-800',
}

const statusColors: Record<string, string> = {
  resolved: 'bg-green-100 text-green-800',
  unresolved: 'bg-red-100 text-red-800',
}

export default function Monitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingAlertId, setResolvingAlertId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'unresolved' | 'resolved'>('all')
  const [activeSeverity, setActiveSeverity] = useState<string>('all')
  const [riderFilter, setRiderFilter] = useState<string>('')
  const [deviationForm, setDeviationForm] = useState({
    order_id: '',
    current_lat: '',
    current_lng: '',
  })
  const [deviationResult, setDeviationResult] = useState<DeviationResult | null>(null)
  const [checkingDeviation, setCheckingDeviation] = useState(false)
  const [stats, setStats] = useState({
    activeAlerts: 0,
    tracksToday: 0,
    pendingChecks: 0,
    avgSpeed: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [alerts, tracks])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [alertsData, tracksData] = await Promise.all([
        api.getAlerts(),
        api.getTracks(),
      ])
      setAlerts(alertsData || [])
      setTracks(tracksData || [])
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const today = new Date().toDateString()
    const activeAlerts = alerts.filter(a => a.resolved === 0).length
    const tracksToday = tracks.filter(t => new Date(t.recorded_at).toDateString() === today).length
    const validSpeeds = tracks.filter(t => t.speed > 0).map(t => t.speed)
    const avgSpeed = validSpeeds.length > 0
      ? validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length
      : 0

    setStats({
      activeAlerts,
      tracksToday,
      pendingChecks: Math.floor(alerts.length * 0.3),
      avgSpeed: Math.round(avgSpeed * 3.6),
    })
  }

  const handleResolveAlert = async (alertId: number) => {
    try {
      setResolvingAlertId(alertId)
      await api.resolveAlert(alertId)
      setAlerts((prev) => prev.map((a) =>
        a.id === alertId ? { ...a, resolved: 1, resolved_at: new Date().toISOString() } : a
      ))
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    } finally {
      setResolvingAlertId(null)
    }
  }

  const handleCheckDeviation = async () => {
    if (!deviationForm.order_id || !deviationForm.current_lat || !deviationForm.current_lng) {
      return
    }

    try {
      setCheckingDeviation(true)
      const result = await api.checkDeviation({
        order_id: Number(deviationForm.order_id),
        current_lat: Number(deviationForm.current_lat),
        current_lng: Number(deviationForm.current_lng),
      })
      setDeviationResult(result)
    } catch (error) {
      console.error('Failed to check deviation:', error)
    } finally {
      setCheckingDeviation(false)
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    const tabMatch =
      activeTab === 'all' ||
      (activeTab === 'unresolved' && alert.resolved === 0) ||
      (activeTab === 'resolved' && alert.resolved === 1)
    const severityMatch = activeSeverity === 'all' || alert.severity === activeSeverity
    return tabMatch && severityMatch
  })

  const filteredTracks = riderFilter
    ? tracks.filter((t) => t.rider_id === Number(riderFilter))
    : tracks.slice(0, 100)

  const uniqueRiders = [...new Map(tracks.map((t) => [t.rider_id, t.rider_name])).entries()]

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MM-dd HH:mm:ss')
    } catch {
      return dateStr
    }
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`
    }
    return `${meters} m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">性能监控中心</h1>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
              实时告警
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">活跃告警</h3>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.activeAlerts}</p>
            <p className="text-sm text-gray-500 mt-2">需要立即处理</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              GPS轨迹
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">今日轨迹</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.tracksToday}</p>
            <p className="text-sm text-gray-500 mt-2">条定位记录</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Search className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              偏离检查
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">待检查</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingChecks}</p>
            <p className="text-sm text-gray-500 mt-2">条待偏离验证</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-green-50 rounded-lg">
              <Gauge className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              配送速度
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">平均速度</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgSpeed} <span className="text-lg">km/h</span></p>
            <p className="text-sm text-gray-500 mt-2">今日平均配送速度</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">告警管理</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['all', 'unresolved', 'resolved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'all' ? '全部' : tab === 'unresolved' ? '未解决' : '已解决'}
                </button>
              ))}
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['all', 'info', 'warning', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setActiveSeverity(sev)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSeverity === sev
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {sev === 'all' ? '全部' : severityLabels[sev] || sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  严重程度
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  消息
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  骑手
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">暂无告警数据</p>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[alert.severity] || severityColors.warning}`}
                      >
                        {alert.severity === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {severityLabels[alert.severity] || alert.severity}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alertTypeColors[alert.alert_type] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {alertTypeLabels[alert.alert_type] || alert.alert_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 max-w-xs truncate" title={alert.message || ''}>
                      {alert.message || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                      {alert.rider_name}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {alert.order_no || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDate(alert.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alert.resolved === 1 ? statusColors.resolved : statusColors.unresolved}`}
                      >
                        {alert.resolved === 1 ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> 已解决</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> 未解决</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {alert.resolved === 0 && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolvingAlertId === alert.id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {resolvingAlertId === alert.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            '解决'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">GPS轨迹</h2>
            <select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部骑手</option>
              {uniqueRiders.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    骑手
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    经纬度
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    速度
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    航向
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    记录时间
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTracks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">暂无轨迹数据</p>
                    </td>
                  </tr>
                ) : (
                  filteredTracks.slice(0, 50).map((track) => (
                    <tr key={track.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {track.rider_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {track.order_no || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {track.latitude.toFixed(6)}, {track.longitude.toFixed(6)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {Math.round(track.speed * 3.6)} km/h
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {track.heading}°
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(track.recorded_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">偏离检查</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                订单ID
              </label>
              <input
                type="number"
                value={deviationForm.order_id}
                onChange={(e) => setDeviationForm({ ...deviationForm, order_id: e.target.value })}
                placeholder="请输入订单ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当前纬度
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={deviationForm.current_lat}
                  onChange={(e) => setDeviationForm({ ...deviationForm, current_lat: e.target.value })}
                  placeholder="例如: 39.9042"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当前经度
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={deviationForm.current_lng}
                  onChange={(e) => setDeviationForm({ ...deviationForm, current_lng: e.target.value })}
                  placeholder="例如: 116.4074"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleCheckDeviation}
              disabled={checkingDeviation || !deviationForm.order_id || !deviationForm.current_lat || !deviationForm.current_lng}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {checkingDeviation ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 检查中...</>
              ) : (
                '检查偏离'
              )}
            </button>

            {deviationResult && (
              <div className={`mt-6 p-4 rounded-lg border ${deviationResult.is_deviated ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  {deviationResult.is_deviated ? (
                    <><AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">检测到轨迹偏离</span></>
                  ) : (
                    <><CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">轨迹正常</span></>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">距取货点距离:</span>
                    <span className="font-medium text-gray-900">{formatDistance(deviationResult.distance_from_pickup_meters)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">距送货点距离:</span>
                    <span className="font-medium text-gray-900">{formatDistance(deviationResult.distance_from_delivery_meters)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">偏离阈值:</span>
                    <span className="font-medium text-gray-900">{formatDistance(deviationResult.deviation_threshold_meters)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">是否偏离:</span>
                    <span className={`font-medium ${deviationResult.is_deviated ? 'text-red-600' : 'text-green-600'}`}>
                      {deviationResult.is_deviated ? '是' : '否'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
