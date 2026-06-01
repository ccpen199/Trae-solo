import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function Distributions() {
  const [distributions, setDistributions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    distribution_date: new Date().toISOString().split('T')[0],
    floor: 1,
    room_number: '',
    linen_category: '床单',
    quantity: 1,
    operator: '',
    remarks: ''
  })

  useEffect(() => {
    loadDistributions()
  }, [])

  async function loadDistributions() {
    const data = await api.get('/distributions')
    setDistributions(data)
  }

  function handleSubmit(e) {
    e.preventDefault()
    api.post('/distributions', form).then(() => {
      loadDistributions()
      setShowModal(false)
      setForm({
        distribution_date: new Date().toISOString().split('T')[0],
        floor: 1,
        room_number: '',
        linen_category: '床单',
        quantity: 1,
        operator: '',
        remarks: ''
      })
    })
  }

  return (
    <div>
      <div className="page-header">
        <h2>📤 布草发放</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增发放</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>发放日期</th>
              <th>楼层</th>
              <th>房间号</th>
              <th>布草品类</th>
              <th>数量</th>
              <th>操作人</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {distributions.map(d => (
              <tr key={d.id}>
                <td>{d.distribution_date}</td>
                <td>{d.floor}楼</td>
                <td>{d.room_number}</td>
                <td>{d.linen_category}</td>
                <td>{d.quantity}</td>
                <td>{d.operator}</td>
                <td>{d.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3>新增布草发放</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>发放日期</label>
                  <input
                    type="date"
                    value={form.distribution_date}
                    onChange={e => setForm({...form, distribution_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>楼层</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={e => setForm({...form, floor: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>房间号</label>
                  <input
                    type="text"
                    value={form.room_number}
                    onChange={e => setForm({...form, room_number: e.target.value})}
                    placeholder="如：101"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>布草品类</label>
                  <select value={form.linen_category} onChange={e => setForm({...form, linen_category: e.target.value})}>
                    <option>床单</option>
                    <option>被套</option>
                    <option>枕套</option>
                    <option>毛巾</option>
                    <option>浴巾</option>
                    <option>地巾</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>数量</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>操作人</label>
                  <input
                    type="text"
                    value={form.operator}
                    onChange={e => setForm({...form, operator: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea
                  value={form.remarks}
                  onChange={e => setForm({...form, remarks: e.target.value})}
                  rows="3"
                />
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

export default Distributions
