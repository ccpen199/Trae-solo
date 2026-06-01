import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrders, getCustomers, getProbes, createOrder } from '../api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [probes, setProbes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    drug_batch: '',
    drug_name: '',
    temp_zone_required: 'cold',
    min_temp: 2,
    max_temp: 8,
    customer_id: '',
    deadline: '',
    qualifications_required: '',
    probe_id: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersRes, customersRes, probesRes] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProbes()
      ])
      setOrders(ordersRes.data)
      setCustomers(customersRes.data)
      setProbes(probesRes.data)
      console.log('Loaded probes:', probesRes.data)
    } catch (e) {
      console.error('Load error:', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createOrder(form)
      setShowModal(false)
      loadData()
      setForm({
        drug_batch: '',
        drug_name: '',
        temp_zone_required: 'cold',
        min_temp: 2,
        max_temp: 8,
        customer_id: '',
        deadline: '',
        qualifications_required: '',
        probe_id: ''
      })
    } catch (e) {
      setError(e.response?.data?.error || '创建失败')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>订单管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          新建订单
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>药品批次</th>
              <th>药品名称</th>
              <th>温区要求</th>
              <th>客户</th>
              <th>时限</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.order_no}</td>
                <td>{o.drug_batch}</td>
                <td>{o.drug_name}</td>
                <td>{o.temp_zone_required} ({o.min_temp}~{o.max_temp}°C)</td>
                <td>{o.customer_name}</td>
                <td>{o.deadline?.slice(0, 16)}</td>
                <td>
                  <span className={`status-badge status-${o.status}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => navigate(`/orders/${o.id}`)}>
                    详情
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  暂无订单
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新建配送订单</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>药品批次 *</label>
                  <input required value={form.drug_batch} onChange={e => setForm({ ...form, drug_batch: e.target.value })} placeholder="如：BATCH2026001" />
                </div>
                <div className="form-group">
                  <label>药品名称</label>
                  <input value={form.drug_name} onChange={e => setForm({ ...form, drug_name: e.target.value })} placeholder="如：胰岛素注射液" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>温区要求</label>
                  <select value={form.temp_zone_required} onChange={e => setForm({ ...form, temp_zone_required: e.target.value })}>
                    <option value="cold">冷藏 (2-8°C)</option>
                    <option value="frozen">冷冻 (-25~-15°C)</option>
                    <option value="room">常温</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>温度范围 (°C)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" value={form.min_temp} onChange={e => setForm({ ...form, min_temp: parseFloat(e.target.value) })} />
                    <span style={{ alignSelf: 'center' }}>~</span>
                    <input type="number" value={form.max_temp} onChange={e => setForm({ ...form, max_temp: parseFloat(e.target.value) })} />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>收货客户 *</label>
                  <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">请选择</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>送达时限</label>
                  <input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>要求资质（逗号分隔）</label>
                  <input value={form.qualifications_required} onChange={e => setForm({ ...form, qualifications_required: e.target.value })} placeholder="如：LIC001,LIC002" />
                </div>
                <div className="form-group">
                  <label>温度探头 (共 {probes.length} 个)</label>
                  <select value={form.probe_id} onChange={e => setForm({ ...form, probe_id: e.target.value })}>
                    <option value="">请选择</option>
                    {probes.map(p => (
                      <option key={p.id} value={p.probe_id}>{p.probe_id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建订单</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
