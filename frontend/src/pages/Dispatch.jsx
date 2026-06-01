import { useState, useEffect } from 'react'
import { getOrders, getDrivers, getVehicles, getDispatches, checkDispatch, createDispatch, startDispatch } from '../api'

export default function Dispatch() {
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [checkResult, setCheckResult] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    order_id: '',
    vehicle_id: '',
    driver_id: '',
    scheduled_time: '',
    route: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersRes, driversRes, vehiclesRes, dispatchesRes] = await Promise.all([
        getOrders(),
        getDrivers(),
        getVehicles(),
        getDispatches()
      ])
      setOrders(ordersRes.data.filter(o => o.status === 'pending'))
      setDrivers(driversRes.data)
      setVehicles(vehiclesRes.data)
      setDispatches(dispatchesRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCheck = async () => {
    if (!form.order_id || !form.vehicle_id || !form.driver_id) return
    try {
      const res = await checkDispatch({
        order_id: form.order_id,
        vehicle_id: form.vehicle_id,
        driver_id: form.driver_id
      })
      setCheckResult(res.data)
    } catch (e) {
      setError(e.response?.data?.error || '校验失败')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createDispatch(form)
      setShowModal(false)
      loadData()
      setForm({ order_id: '', vehicle_id: '', driver_id: '', scheduled_time: '', route: '' })
      setCheckResult(null)
    } catch (e) {
      setError(e.response?.data?.error || '创建失败')
    }
  }

  const handleStart = async (id) => {
    try {
      await startDispatch(id)
      loadData()
    } catch (e) {
      alert('启动失败')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>调度中心</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          创建配送
        </button>
      </div>

      <div className="card">
        <h3>待调度订单</h3>
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>药品</th>
              <th>温区</th>
              <th>客户</th>
              <th>时限</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.order_no}</td>
                <td>{o.drug_name}</td>
                <td>{o.temp_zone_required} ({o.min_temp}~{o.max_temp}°C)</td>
                <td>{o.customer_name}</td>
                <td>{o.deadline?.slice(0, 16)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#666' }}>无待调度订单</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>配送任务</h3>
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>车辆</th>
              <th>司机</th>
              <th>计划时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.map(d => (
              <tr key={d.id}>
                <td>{d.order_no}</td>
                <td>{d.plate_number}</td>
                <td>{d.driver_name}</td>
                <td>{d.scheduled_time?.slice(0, 16)}</td>
                <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
                <td>
                  {d.status === 'scheduled' && (
                    <button className="btn btn-sm btn-success" onClick={() => handleStart(d.id)}>
                      开始配送
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3>司机列表</h3>
          <table>
            <thead>
              <tr><th>姓名</th><th>驾照号</th><th>冷链资质</th><th>状态</th></tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.license_number}</td>
                  <td>{d.cold_chain_cert ? '✓ 有' : '✗ 无'}</td>
                  <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>车辆列表</h3>
          <table>
            <thead>
              <tr><th>车牌号</th><th>类型</th><th>温控范围</th><th>设备</th><th>状态</th></tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td>{v.plate_number}</td>
                  <td>{v.vehicle_type}</td>
                  <td>{v.min_temp}~{v.max_temp}°C</td>
                  <td><span className={`status-badge ${v.device_status === 'normal' ? 'status-delivered' : 'status-rejected'}`}>{v.device_status}</span></td>
                  <td><span className={`status-badge status-${v.status === 'idle' ? 'delivered' : 'in_transit'}`}>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setCheckResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>创建配送任务</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择订单 *</label>
                <select required value={form.order_id} onChange={e => { setForm({ ...form, order_id: e.target.value }); setCheckResult(null); }}>
                  <option value="">请选择</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_no} - {o.drug_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>选择车辆 *</label>
                  <select required value={form.vehicle_id} onChange={e => { setForm({ ...form, vehicle_id: e.target.value }); setCheckResult(null); }}>
                    <option value="">请选择</option>
                    {vehicles.filter(v => v.status === 'idle' && v.device_status === 'normal').map(v => (
                      <option key={v.id} value={v.id}>{v.plate_number} ({v.min_temp}~{v.max_temp}°C)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>选择司机 *</label>
                  <select required value={form.driver_id} onChange={e => { setForm({ ...form, driver_id: e.target.value }); setCheckResult(null); }}>
                    <option value="">请选择</option>
                    {drivers.filter(d => d.status === 'active' && d.cold_chain_cert).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>计划发车时间</label>
                  <input type="datetime-local" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>路线</label>
                  <input value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} placeholder="如：市区快速路" />
                </div>
              </div>

              <button type="button" className="btn" onClick={handleCheck} style={{ marginBottom: 16 }}>
                校验资质
              </button>

              {checkResult && (
                <div className={`card ${checkResult.eligible ? '' : 'error'}`} style={{ padding: 12, marginBottom: 16 }}>
                  {checkResult.eligible ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ 资质校验通过，可以出车</span>
                  ) : (
                    <div>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>✗ 校验不通过：</span>
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        {checkResult.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => { setShowModal(false); setCheckResult(null); }}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={checkResult && !checkResult.eligible}>
                  创建配送
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
