import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function Settlements() {
  const [settlements, setSettlements] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [calculatedData, setCalculatedData] = useState([])
  const [form, setForm] = useState({
    supplier_id: '',
    settlement_month: new Date().toISOString().slice(0, 7),
    linen_category: '床单',
    washing_quantity: 0,
    unit_price: 0,
    remarks: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [setl, supp] = await Promise.all([api.get('/settlements'), api.get('/suppliers')])
    setSettlements(setl)
    setSuppliers(supp)
  }

  async function calculateSettlement() {
    if (form.supplier_id && form.settlement_month) {
      const data = await api.get(`/settlements/calculate/${form.supplier_id}/${form.settlement_month}`)
      setCalculatedData(data)
      if (data.length > 0) {
        setForm({...form, linen_category: data[0].linen_category, washing_quantity: data[0].total_quantity || 0})
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    api.post('/settlements', form).then(() => {
      loadData()
      setShowModal(false)
      setCalculatedData([])
      setForm({
        supplier_id: '',
        settlement_month: new Date().toISOString().slice(0, 7),
        linen_category: '床单',
        washing_quantity: 0,
        unit_price: 0,
        remarks: ''
      })
    })
  }

  function markPaid(id) {
    api.put(`/settlements/${id}/pay`, { payment_date: new Date().toISOString().split('T')[0] }).then(loadData)
  }

  const statusLabels = { pending: '待付款', paid: '已付款' }

  return (
    <div>
      <div className="page-header">
        <h2>💰 供应商结算</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增结算</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>结算月份</th>
              <th>供应商</th>
              <th>布草品类</th>
              <th>洗涤数量</th>
              <th>单价</th>
              <th>总金额</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map(s => (
              <tr key={s.id}>
                <td>{s.settlement_month}</td>
                <td>{s.supplier_name}</td>
                <td>{s.linen_category}</td>
                <td>{s.washing_quantity}</td>
                <td>¥{s.unit_price}</td>
                <td>¥{s.total_amount.toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${s.status}`}>
                    {statusLabels[s.status]}
                  </span>
                </td>
                <td>
                  {s.status === 'pending' && (
                    <button className="btn btn-sm btn-success" onClick={() => markPaid(s.id)}>标记付款</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3>新增结算单</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>供应商</label>
                  <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} required>
                    <option value="">请选择</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>结算月份</label>
                  <input
                    type="month"
                    value={form.settlement_month}
                    onChange={e => setForm({...form, settlement_month: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div style={{ margin: '12px 0' }}>
                <button type="button" className="btn btn-secondary" onClick={calculateSettlement}>
                  计算该月洗涤数量
                </button>
              </div>
              {calculatedData.length > 0 && (
                <div className="alert alert-info">
                  查询到数据：
                  {calculatedData.map(d => (
                    <span key={d.linen_category} style={{ marginLeft: '10px' }}>
                      {d.linen_category}: {d.total_quantity}件
                    </span>
                  ))}
                </div>
              )}
              <div className="form-grid">
                <div className="form-group">
                  <label>布草品类</label>
                  <select value={form.linen_category} onChange={e => setForm({...form, linen_category: e.target.value})}>
                    <option>床单</option><option>被套</option><option>枕套</option><option>毛巾</option><option>浴巾</option><option>地巾</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>洗涤数量</label>
                  <input type="number" value={form.washing_quantity} onChange={e => setForm({...form, washing_quantity: parseInt(e.target.value) || 0})} min="0" required />
                </div>
                <div className="form-group">
                  <label>单价（元）</label>
                  <input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: parseFloat(e.target.value) || 0})} min="0" required />
                </div>
                <div className="form-group">
                  <label>总金额</label>
                  <input type="text" value={`¥${(form.washing_quantity * form.unit_price).toFixed(2)}`} disabled />
                </div>
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} rows="2" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settlements
