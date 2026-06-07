import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Radio, MapPin, CheckCircle, X, Navigation } from 'lucide-react'
import { api, buildQuery } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Alert {
  id: number
  type: string
  description: string
  status: string
  rider_name: string | null
  order_no: string | null
  zone_name: string | null
  rider_id: number | null
  order_id: number | null
  created_at: string
  handled_at: string | null
}

interface TrajectoryPoint {
  id: number
  rider_name: string
  order_no: string
  longitude: number
  latitude: number
  timestamp: string
  is_abnormal: number
}

interface VerifyLog {
  id: number
  action: string
  operator: string
  reason: string
  created_at: string
}

const alertTypeMap: Record<string, { label: string; cls: string }> = {
  trajectory_abnormal: { label: '异常停留', cls: 'bg-red-100 text-red-700' },
  delivery_timeout: { label: '超时未送', cls: 'bg-orange-100 text-orange-700' },
  pickup_timeout: { label: '超时未取', cls: 'bg-yellow-100 text-yellow-700' },
  health_code: { label: '健康码异常', cls: 'bg-red-100 text-red-700' },
  complaint: { label: '客户投诉', cls: 'bg-orange-100 text-orange-700' },
  high_load: { label: '运力不足', cls: 'bg-yellow-100 text-yellow-700' },
  verify_alert: { label: '审核预警', cls: 'bg-yellow-100 text-yellow-700' },
  order_cancel: { label: '订单取消', cls: 'bg-gray-100 text-gray-700' },
}

type TabKey = 'alerts' | 'trajectory'

export default function TrackingCenter() {
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const [tab, setTab] = useState<TabKey>('alerts')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertFilter, setAlertFilter] = useState('')
  const [trajectories, setTrajectories] = useState<TrajectoryPoint[]>([])
  const [trajRiderId, setTrajRiderId] = useState('')
  const [trajOrderId, setTrajOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [handlingAlertId, setHandlingAlertId] = useState<number | null>(null)
  const [handleRemark, setHandleRemark] = useState('')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [alertTrajectories, setAlertTrajectories] = useState<TrajectoryPoint[]>([])
  const [alertVerifyLogs, setAlertVerifyLogs] = useState<VerifyLog[]>([])

  useEffect(() => {
    setLoading(true)
    const q = buildQuery({ status: alertFilter || undefined })
    api<Alert[]>(`/api/alerts${q}`).then((r) => {
      if (r.success) setAlerts(r.data!)
      setLoading(false)
    })
  }, [alertFilter])

  async function handleAlert(id: number) {
    const res = await api(`/api/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ remark: handleRemark }),
    })
    if (res.success) {
      addToast('告警已处理', 'success')
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'handled' } : a)))
      setHandlingAlertId(null)
      setHandleRemark('')
    } else {
      addToast(res.error || '处理失败', 'error')
    }
  }

  function openHandleDialog(id: number) {
    setHandlingAlertId(id)
    setHandleRemark('')
  }

  function closeHandleDialog() {
    setHandlingAlertId(null)
    setHandleRemark('')
  }

  function handleTrajectorySearch() {
    if (!trajRiderId && !trajOrderId) {
      addToast('请输入骑手ID或订单ID', 'error')
      return
    }
    const q = buildQuery({ rider_id: trajRiderId || undefined, order_id: trajOrderId || undefined })
    api<TrajectoryPoint[]>(`/api/trajectories${q}`).then((r) => {
      if (r.success) setTrajectories(r.data!)
      else addToast(r.error || '查询失败', 'error')
    })
  }

  async function viewAlertDetail(alert: Alert) {
    setSelectedAlert(alert)
    setAlertTrajectories([])
    setAlertVerifyLogs([])

    if (alert.order_id) {
      const res = await api<TrajectoryPoint[]>(`/api/trajectories?order_id=${alert.order_id}`)
      if (res.success) setAlertTrajectories(res.data!)
    } else if (alert.rider_id) {
      const res = await api<TrajectoryPoint[]>(`/api/trajectories?rider_id=${alert.rider_id}`)
      if (res.success) setAlertTrajectories(res.data!)
    }

    const logsRes = await api<{ list: VerifyLog[] }>(`/api/verify-logs?target_type=alert&target_id=${alert.id}`)
    if (logsRes.success) setAlertVerifyLogs(logsRes.data!.list)
  }

  function closeAlertDetail() {
    setSelectedAlert(null)
    setAlertTrajectories([])
    setAlertVerifyLogs([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
        <button
          onClick={() => setTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'alerts' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <AlertTriangle size={16} /> 告警列表
        </button>
        <button
          onClick={() => setTab('trajectory')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'trajectory' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Radio size={16} /> 轨迹查询
        </button>
      </div>

      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <select className="select-base" value={alertFilter} onChange={(e) => setAlertFilter(e.target.value)}>
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="handled">已处理</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">告警类型</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">描述</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">骑手</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">订单</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">时间</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">加载中...</td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">暂无告警</td></tr>
                ) : (
                  alerts.map((alert) => {
                    const t = alertTypeMap[alert.type] || { label: alert.type, cls: 'bg-gray-100 text-gray-600' }
                    return (
                      <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.cls}`}>{t.label}</span></td>
                        <td className="px-5 py-3 text-sm text-gray-600 max-w-[250px]">
                          {alert.type === 'high_load' && alert.zone_name ? (
                            <span>[{alert.zone_name}] {alert.description}</span>
                          ) : (
                            <span>{alert.description}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{alert.rider_name || '-'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{alert.order_no || '-'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            alert.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {alert.status === 'pending' ? '待处理' : '已处理'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400">{alert.created_at?.slice(5, 16)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => viewAlertDetail(alert)} className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
                              <MapPin size={14} /> 查看
                            </button>
                            {alert.type === 'high_load' && (
                              <button onClick={() => navigate('/dispatch')} className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1">
                                <Navigation size={14} /> 去调度
                              </button>
                            )}
                            {alert.status === 'pending' && (
                              <button onClick={() => openHandleDialog(alert.id)} className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1">
                                <CheckCircle size={14} /> 处理
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'trajectory' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <input
                className="input-base w-48"
                placeholder="骑手ID"
                value={trajRiderId}
                onChange={(e) => setTrajRiderId(e.target.value)}
              />
              <span className="text-gray-400 text-sm">或</span>
              <input
                className="input-base w-48"
                placeholder="订单ID"
                value={trajOrderId}
                onChange={(e) => setTrajOrderId(e.target.value)}
              />
              <button onClick={handleTrajectorySearch} className="btn-primary">查询轨迹</button>
            </div>
          </div>

          {trajectories.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <h3 className="font-semibold text-gray-900">轨迹记录</h3>
                <span className="text-xs text-gray-400 ml-auto">{trajectories.length}条</span>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <div className="relative ml-4">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                  {trajectories.map((pt, idx) => (
                    <div key={pt.id} className="flex items-start gap-4 mb-4 relative">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 ${
                        pt.is_abnormal ? 'border-red-500 bg-red-100' : idx === 0 ? 'border-primary bg-primary/20' : 'border-gray-300 bg-white'
                      }`} />
                      <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-800">{pt.rider_name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">订单 {pt.order_no}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>经度: {pt.longitude.toFixed(4)}</span>
                          <span>纬度: {pt.latitude.toFixed(4)}</span>
                          {pt.is_abnormal === 1 && <span className="text-red-500 font-medium">轨迹异常</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{pt.timestamp?.slice(0, 19)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {handlingAlertId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeHandleDialog}>
          <div className="bg-white rounded-xl shadow-xl w-[420px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">处理告警</h3>
              <button onClick={closeHandleDialog} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
              <textarea
                className="input-base w-full h-24 resize-none"
                placeholder="请输入处理备注（可选）"
                value={handleRemark}
                onChange={(e) => setHandleRemark(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={closeHandleDialog} className="btn-outline">取消</button>
              <button onClick={() => handleAlert(handlingAlertId)} className="btn-primary flex items-center gap-1">
                <CheckCircle size={14} /> 确认处理
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50" onClick={closeAlertDetail}>
          <div
            className="bg-white h-full w-[600px] shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">告警详情</h3>
                <button onClick={closeAlertDetail} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    alertTypeMap[selectedAlert.type]?.cls || 'bg-gray-100 text-gray-600'
                  }`}>
                    {alertTypeMap[selectedAlert.type]?.label || selectedAlert.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedAlert.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedAlert.status === 'pending' ? '待处理' : '已处理'}
                  </span>
                </div>
                <div className="text-sm text-gray-900">{selectedAlert.description}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">骑手：</span>
                    <span className="text-gray-900">{selectedAlert.rider_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">订单：</span>
                    <span className="text-gray-900">{selectedAlert.order_no || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">触发时间：</span>
                    <span className="text-gray-900">{selectedAlert.created_at?.slice(0, 19)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">处理时间：</span>
                    <span className="text-gray-900">{selectedAlert.handled_at?.slice(0, 19) || '-'}</span>
                  </div>
                </div>
              </div>

              {alertTrajectories.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-primary" /> 关联轨迹
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <div className="relative ml-4">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                      {alertTrajectories.map((pt, idx) => (
                        <div key={pt.id} className="flex items-start gap-4 mb-4 relative">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 ${
                            pt.is_abnormal ? 'border-red-500 bg-red-100' : idx === 0 ? 'border-primary bg-primary/20' : 'border-gray-300 bg-white'
                          }`} />
                          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>经度: {pt.longitude.toFixed(4)}</span>
                              <span>纬度: {pt.latitude.toFixed(4)}</span>
                              {pt.is_abnormal === 1 && <span className="text-red-500 font-medium">异常点</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{pt.timestamp?.slice(0, 19)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {alertVerifyLogs.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" /> 处理记录
                  </h4>
                  <div className="space-y-2">
                    {alertVerifyLogs.map((log) => (
                      <div key={log.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-800">处理完成</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{log.operator}</span>
                        </div>
                        {log.reason && (
                          <div className="text-xs text-gray-500 mt-1">
                            处理意见：{log.reason}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">{log.created_at?.slice(0, 19)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alertVerifyLogs.length === 0 && selectedAlert.status === 'handled' && (
                <div className="text-center text-gray-400 text-sm py-4">暂无处理记录</div>
              )}

              {selectedAlert.status === 'pending' && (
                <button
                  onClick={() => { closeAlertDetail(); openHandleDialog(selectedAlert.id) }}
                  className="w-full btn-primary flex items-center justify-center gap-1"
                >
                  <CheckCircle size={14} /> 立即处理
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
