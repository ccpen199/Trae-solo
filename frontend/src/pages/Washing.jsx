import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function Washing() {
  const [records, setRecords] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [returnModal, setReturnModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [form, setForm] = useState({
    supplier_id: '',
    send_date: new Date().toISOString().split('T')[0],
    linen_category: '床单',
    send_quantity: 1,
    operator: '',
    remarks: ''
  })
  const [returnForm, setReturnForm] = useState({
    return_date: new Date().toISOString().split('T')[0],
    return_quantity: 0,
    washing_quality: 'good',
    rewash_reason: '',
    operator: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [rec, supp] = await Promise.all([api.get('/washing'), api.get('/suppliers')])
    setRecords(rec)
    setSuppliers(supp)
  }

  function handleSubmit(e) {
    e.preventDefault()
    api.post('/washing', form).then(() => {
      loadData()
      setShowModal(false)
    })
  }

  function openReturnModal(record) {
    setSelectedRecord(record)
    setReturnForm({
      return_date: new Date().toISOString().split('T')[0],
      return_quantity: record.send_quantity,
      washing_quality: 'good',
      rewash_reason: '',
      operator: ''
    })
    setReturnModal(true)
  }

  function handleReturn(e) {
    e.preventDefault()
    api.put(`/washing/${selectedRecord.id}/return`, returnForm).then(() => {
      loadData()
      setReturnModal(false)
    })
  }

  const statusLabels = { in_wash: '洗涤中', completed: '已完成', partial: '部分返回' }

  return (
    <div>
      <div className="page-header">
        <h2>🧺 洗涤管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 送洗</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>送洗日期</th>
              <th>供应商</th>
              <th>布草品类</th>
              <th>送洗数量</th>
              <th>返回数量</th>
              <th>洗涤质量</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.send_date}</td>
                <td>{r.supplier_name}</td>
                <td>{r.linen_category}</td>
                <td>{r.send_quantity}</td>
                <td>{r.return_quantity || '-'}</td>
                <td>{r.washing_quality === 'good' ? '良好' : r.washing_quality === 'normal' ? '一般' : '差'}</td>
                <td><span className={`status-badge status-${r.status}`}>{statusLabels[r.status]}</span></td>
                <td>
                  {r.status === 'in_wash' && (
                    <button className="btn btn-sm btn-success" onClick={() => openReturnModal(r)}>登记返回</button>
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
            <h3>布草送洗</h3>
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
                  <label>送洗日期</label>
                  <input type="date" value={form.send_date} onChange={e => setForm({...form, send_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>布草品类</label>
                  <select value={form.linen_category} onChange={e => setForm({...form, linen_category: e.target.value})}>
                    <option>床单</option><option>被套</option><option>枕套</option><option>毛巾</option><option>浴巾</option><option>地巾</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>送洗数量</label>
                  <input type="number" value={form.send_quantity} onChange={e => setForm({...form, send_quantity: parseInt(e.target.value)})} min="1" required />
                </div>
                <div className="form-group">
                  <label>操作人</label>
                  <input type="text" value={form.operator} onChange={e => setForm({...form, operator: e.target.value})} required />
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

      {returnModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReturnModal(false)}>
          <div className="modal">
            <h3>登记洗涤返回 - {selectedRecord?.supplier_name}</h3>
            <form onSubmit={handleReturn}>
              <div className="form-group">
                <label>送洗数量：{selectedRecord?.send_quantity} 件</label>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>返回日期</label>
                  <input type="date" value={returnForm.return_date} onChange={e => setReturnForm({...returnForm, return_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>实际返回数量</label>
                  <input type="number" value={returnForm.return_quantity} onChange={e => setReturnForm({...returnForm, return_quantity: parseInt(e.target.value)})} min="0" required />
                </div>
                <div className="form-group">
                  <label>洗涤质量</label>
                  <select value={returnForm.washing_quality} onChange={e => setReturnForm({...returnForm, washing_quality: e.target.value})}>
                    <option value="good">良好</option>
                    <option value="normal">一般</option>
                    <option value="poor">差（需返洗）</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>操作人</label>
                  <input type="text" value={returnForm.operator} onChange={e => setReturnForm({...returnForm, operator: e.target.value})} required />
                </div>
              </div>
              {returnForm.washing_quality === 'poor' && (
                <div className="form-group">
                  <label>返洗原因</label>
                  <textarea value={returnForm.rewash_reason} onChange={e => setReturnForm({...returnForm, rewash_reason: e.target.value})} rows="2" required />
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setReturnModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Washing
