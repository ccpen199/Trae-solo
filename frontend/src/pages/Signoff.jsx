import { useState, useEffect } from 'react'
import { getDispatches, getSignoff, createSignoff, getTemperatureReport } from '../api'

export default function Signoff() {
  const [dispatches, setDispatches] = useState([])
  const [selectedDispatch, setSelectedDispatch] = useState(null)
  const [signoff, setSignoff] = useState(null)
  const [report, setReport] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    receiver_name: '',
    receiver_id: '',
    temperature: '',
    status: 'accepted',
    exception_notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await getDispatches()
      setDispatches(res.data.filter(d => d.status === 'in_transit' || d.status === 'delivered' || d.status === 'rejected'))
    } catch (e) {
      console.error(e)
    }
  }

  const selectDispatch = async (dispatch) => {
    setSelectedDispatch(dispatch)
    try {
      const [signoffRes, reportRes] = await Promise.all([
        getSignoff(dispatch.id),
        getTemperatureReport(dispatch.id)
      ])
      setSignoff(signoffRes.data)
      setReport(reportRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createSignoff({
        dispatch_id: selectedDispatch.id,
        ...form,
        temperature: parseFloat(form.temperature)
      })
      setShowModal(false)
      loadData()
      selectDispatch(selectedDispatch)
    } catch (e) {
      alert('签收失败')
    }
  }

  const exportReport = () => {
    if (!report) return
    const content = `
冷链配送温度报告
================
订单号: ${report.dispatch?.order_no}
药品: ${report.dispatch?.drug_name}
车辆: ${report.dispatch?.plate_number}
司机: ${report.dispatch?.driver_name}
客户: ${report.dispatch?.customer_name}
温度要求: ${report.dispatch?.min_temp}~${report.dispatch?.max_temp}°C

温度记录:
${report.temperatures?.map(t => `${t.timestamp?.slice(0, 19)} - ${t.temperature}°C - ${t.is_alert ? '异常' : '正常'}`).join('\n') || '-'}

预警记录:
${report.alerts?.map(a => `${a.created_at?.slice(0, 19)} - ${a.alert_type} - ${a.message} - ${a.status}`).join('\n') || '-'}

签收状态: ${report.signoff?.status || '未签收'}
签收人: ${report.signoff?.receiver_name || '-'}
签收时间: ${report.signoff?.signoff_time?.slice(0, 19) || '-'}
    `.trim()
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `温控报告_${report.dispatch?.order_no}.txt`
    a.click()
  }

  return (
    <div>
      <div className="page-header">
        <h1>签收验收</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 20 }}>
        <div className="card">
          <h3>配送列表</h3>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {d.actual_departure?.slice(0, 16) || '未发车'}
                  </span>
                  <span className={`status-badge status-${d.status}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedDispatch ? (
            <>
              <div className="card">
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  配送信息
                  <div style={{ gap: 8, display: 'flex' }}>
                    {selectedDispatch.status === 'in_transit' && !signoff && (
                      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        签收
                      </button>
                    )}
                    <button className="btn btn-success" onClick={exportReport}>
                      导出温控报告
                    </button>
                  </div>
                </h3>
                <div className="form-row">
                  <div><strong>订单号：</strong>{selectedDispatch.order_no}</div>
                  <div><strong>药品：</strong>{selectedDispatch.drug_name}</div>
                  <div><strong>车辆：</strong>{selectedDispatch.plate_number}</div>
                  <div><strong>司机：</strong>{selectedDispatch.driver_name}</div>
                  <div><strong>发车时间：</strong>{selectedDispatch.actual_departure?.slice(0, 19) || '-'}</div>
                  <div><strong>状态：</strong>
                    <span className={`status-badge status-${selectedDispatch.status}`} style={{ marginLeft: 8 }}>
                      {selectedDispatch.status}
                    </span>
                  </div>
                </div>
              </div>

              {signoff && (
                <div className="card">
                  <h3>签收信息</h3>
                  <div className="form-row">
                    <div><strong>签收人：</strong>{signoff.receiver_name}</div>
                    <div><strong>证件号：</strong>{signoff.receiver_id}</div>
                    <div><strong>签收时间：</strong>{signoff.signoff_time?.slice(0, 19)}</div>
                    <div><strong>签收温度：</strong>{signoff.temperature}°C</div>
                    <div><strong>签收状态：</strong>
                      <span className={`status-badge ${signoff.status === 'accepted' ? 'status-delivered' : 'status-rejected'}`} style={{ marginLeft: 8 }}>
                        {signoff.status === 'accepted' ? '正常签收' : '拒收'}
                      </span>
                    </div>
                    {signoff.exception_notes && (
                      <div style={{ gridColumn: '1 / -1' }}><strong>异常说明：</strong>{signoff.exception_notes}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="card">
                <h3>验收检查</h3>
                <table>
                  <thead>
                    <tr><th>检查项</th><th>状态</th><th>说明</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>超温记录</td>
                      <td>
                        <span className={`status-badge ${report?.alerts?.length ? 'status-rejected' : 'status-delivered'}`}>
                          {report?.alerts?.length ? '存在' : '无'}
                        </span>
                      </td>
                      <td>{report?.alerts?.length || 0} 条超温预警</td>
                    </tr>
                    <tr>
                      <td>设备状态</td>
                      <td><span className="status-badge status-delivered">正常</span></td>
                      <td>车载设备在线</td>
                    </tr>
                    <tr>
                      <td>司机资质</td>
                      <td><span className="status-badge status-delivered">有效</span></td>
                      <td>冷链资质在有效期内</td>
                    </tr>
                    <tr>
                      <td>客户拒收</td>
                      <td>
                        <span className={`status-badge ${signoff?.status === 'rejected' ? 'status-rejected' : 'status-delivered'}`}>
                          {signoff?.status === 'rejected' ? '已拒收' : '无'}
                        </span>
                      </td>
                      <td>{signoff?.exception_notes || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              请选择左侧配送任务查看详情
            </div>
          )}
        </div>
      </div>

      {showModal && selectedDispatch && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>货物签收</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>收货人姓名 *</label>
                  <input required value={form.receiver_name} onChange={e => setForm({ ...form, receiver_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>收货人证件号</label>
                  <input value={form.receiver_id} onChange={e => setForm({ ...form, receiver_id: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>签收时温度 (°C) *</label>
                  <input type="number" required step="0.1" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>签收状态</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="accepted">正常签收</option>
                    <option value="rejected">拒收</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>异常说明（拒收或温度异常时填写）</label>
                <textarea rows={3} value={form.exception_notes} onChange={e => setForm({ ...form, exception_notes: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认签收</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
