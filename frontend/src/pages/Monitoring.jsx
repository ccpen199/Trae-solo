import { useState, useEffect } from 'react'
import { getDispatches, getTemperatures, getAlerts, handleAlert, addTemperatureRecord } from '../api'

export default function Monitoring() {
  const [dispatches, setDispatches] = useState([])
  const [selectedDispatch, setSelectedDispatch] = useState(null)
  const [temperatures, setTemperatures] = useState([])
  const [alerts, setAlerts] = useState([])
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [handlingNotes, setHandlingNotes] = useState('')

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [dispatchesRes, alertsRes] = await Promise.all([
        getDispatches(),
        getAlerts()
      ])
      setDispatches(dispatchesRes.data.filter(d => d.status === 'in_transit' || d.status === 'scheduled'))
      setAlerts(alertsRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  const selectDispatch = async (dispatch) => {
    setSelectedDispatch(dispatch)
    try {
      const res = await getTemperatures(dispatch.id)
      setTemperatures(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const simulateTemp = async () => {
    if (!selectedDispatch) return
    const baseTemp = (selectedDispatch.min_temp + selectedDispatch.max_temp) / 2
    const fluctuation = (Math.random() - 0.5) * 10
    const temp = Math.round((baseTemp + fluctuation) * 10) / 10
    
    try {
      await addTemperatureRecord({
        dispatch_id: selectedDispatch.id,
        probe_id: 'PROBE001',
        temperature: temp,
        location: '在途'
      })
      selectDispatch(selectedDispatch)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAlertSubmit = async () => {
    try {
      await handleAlert(selectedAlert.id, { handled_by: '质控员', handling_notes: handlingNotes })
      setShowAlertModal(false)
      setSelectedAlert(null)
      setHandlingNotes('')
      loadData()
    } catch (e) {
      alert('处理失败')
    }
  }

  const maxTemp = Math.max(...temperatures.map(t => t.temperature), 10)
  const minTemp = Math.min(...temperatures.map(t => t.temperature), 0)

  return (
    <div>
      <div className="page-header">
        <h1>在途监控</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div className="card">
          <h3>在途车辆</h3>
          <div style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
            {dispatches.map(d => (
              <div
                key={d.id}
                onClick={() => selectDispatch(d)}
                style={{
                  padding: 12,
                  border: selectedDispatch?.id === d.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: selectedDispatch?.id === d.id ? '#eff6ff' : '#fff'
                }}
              >
                <div style={{ fontWeight: 600 }}>{d.order_no}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{d.plate_number} - {d.driver_name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>状态: {d.status}</div>
              </div>
            ))}
            {dispatches.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>无在途配送</div>
            )}
          </div>
        </div>

        <div>
          {selectedDispatch ? (
            <>
              <div className="card">
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  温度监控 - {selectedDispatch.order_no}
                  <button className="btn btn-sm btn-primary" onClick={simulateTemp}>
                    模拟温度数据
                  </button>
                </h3>
                <div className="temp-chart">
                  {temperatures.slice(-30).map((t, i) => (
                    <div
                      key={t.id || i}
                      className={`temp-bar ${t.is_alert ? 'alert' : ''}`}
                      style={{ height: `${((t.temperature - minTemp) / (maxTemp - minTemp + 0.1)) * 100}%` }}
                      title={`${t.temperature}°C - ${t.timestamp?.slice(11, 19)}`}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                  正常范围: {selectedDispatch.min_temp}~{selectedDispatch.max_temp}°C
                  {temperatures.length > 0 && ` | 最新: ${temperatures[0]?.temperature}°C`}
                </div>
              </div>

              <div className="card">
                <h3>温度记录</h3>
                <table>
                  <thead>
                    <tr><th>时间</th><th>温度</th><th>位置</th><th>状态</th></tr>
                  </thead>
                  <tbody>
                    {temperatures.slice(0, 10).map(t => (
                      <tr key={t.id}>
                        <td>{t.timestamp?.slice(0, 19)}</td>
                        <td style={{ color: t.is_alert ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
                          {t.temperature}°C
                        </td>
                        <td>{t.location}</td>
                        <td>
                          <span className={`status-badge ${t.is_alert ? 'status-rejected' : 'status-delivered'}`}>
                            {t.is_alert ? '异常' : '正常'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              请选择左侧配送任务查看监控数据
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>预警列表</h3>
        <table>
          <thead>
            <tr><th>订单</th><th>类型</th><th>消息</th><th>级别</th><th>时间</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id}>
                <td>{a.order_no}</td>
                <td>{a.alert_type}</td>
                <td>{a.message}</td>
                <td><span className="status-badge status-rejected">{a.alert_level}</span></td>
                <td>{a.created_at?.slice(0, 19)}</td>
                <td>
                  <span className={`status-badge ${a.status === 'handled' ? 'status-delivered' : 'status-pending'}`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  {a.status === 'pending' && (
                    <button className="btn btn-sm btn-primary" onClick={() => { setSelectedAlert(a); setShowAlertModal(true); }}>
                      处理
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#666' }}>暂无预警</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAlertModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>处理预警</h2>
            <div style={{ marginBottom: 16 }}>
              <div><strong>预警类型：</strong>{selectedAlert.alert_type}</div>
              <div><strong>预警消息：</strong>{selectedAlert.message}</div>
            </div>
            <div className="form-group">
              <label>处理说明</label>
              <textarea rows={4} value={handlingNotes} onChange={e => setHandlingNotes(e.target.value)} placeholder="请输入处理说明..." />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowAlertModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAlertSubmit}>确认处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
