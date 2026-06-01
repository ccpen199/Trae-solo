import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function Collections() {
  const [collections, setCollections] = useState([])
  const [discrepancies, setDiscrepancies] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [form, setForm] = useState({
    collection_date: new Date().toISOString().split('T')[0],
    floor: 1,
    room_number: '',
    linen_category: '床单',
    quantity: 1,
    expected_quantity: '',
    damage_condition: '',
    operator: '',
    remarks: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    if (activeTab === 'all') {
      const data = await api.get('/collections')
      setCollections(data)
    } else {
      const data = await api.get('/collections/discrepancies')
      setDiscrepancies(data)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    api.post('/collections', form).then(() => {
      loadData()
      setShowModal(false)
      setForm({
        collection_date: new Date().toISOString().split('T')[0],
        floor: 1,
        room_number: '',
        linen_category: '床单',
        quantity: 1,
        expected_quantity: '',
        damage_condition: '',
        operator: '',
        remarks: ''
      })
    })
  }

  function resolveDiscrepancy(id) {
    const resolution = prompt('请输入解决说明：')
    if (resolution) {
      api.post(`/collections/${id}/resolve`, { resolution_note: resolution, operator: '管理员' }).then(loadData)
    }
  }

  const displayList = activeTab === 'all' ? collections : discrepancies

  return (
    <div>
      <div className="page-header">
        <h2>📥 布草回收</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增回收</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('all')}
          >
            全部回收记录
          </button>
          <button
            className={`btn ${activeTab === 'discrepancies' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('discrepancies')}
          >
            差异待处理 ({discrepancies.length})
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>回收日期</th>
              <th>楼层</th>
              <th>房间号</th>
              <th>布草品类</th>
              <th>数量</th>
              <th>污损情况</th>
              <th>操作人</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map(c => (
              <tr key={c.id}>
                <td>{c.collection_date}</td>
                <td>{c.floor}楼</td>
                <td>{c.room_number}</td>
                <td>{c.linen_category}</td>
                <td>{c.quantity}</td>
                <td>{c.damage_condition || '-'}</td>
                <td>{c.operator}</td>
                <td>
                  {c.has_discrepancy ? (
                    <span className="status-badge status-pending">有差异</span>
                  ) : (
                    <span className="status-badge status-approved">正常</span>
                  )}
                </td>
                <td>
                  {c.has_discrepancy && (
                    <button className="btn btn-sm btn-success" onClick={() => resolveDiscrepancy(c.id)}>
                      解决
                    </button>
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
            <h3>新增布草回收</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>回收日期</label>
                  <input type="date" value={form.collection_date} onChange={e => setForm({...form, collection_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>楼层</label>
                  <input type="number" value={form.floor} onChange={e => setForm({...form, floor: parseInt(e.target.value)})} min="1" required />
                </div>
                <div className="form-group">
                  <label>房间号</label>
                  <input type="text" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>布草品类</label>
                  <select value={form.linen_category} onChange={e => setForm({...form, linen_category: e.target.value})}>
                    <option>床单</option><option>被套</option><option>枕套</option><option>毛巾</option><option>浴巾</option><option>地巾</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>实际回收数量</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} min="0" required />
                </div>
                <div className="form-group">
                  <label>预期数量（可选）</label>
                  <input type="number" value={form.expected_quantity} onChange={e => setForm({...form, expected_quantity: e.target.value})} min="0" placeholder="与实际不同将标记差异" />
                </div>
                <div className="form-group">
                  <label>污损情况</label>
                  <input type="text" value={form.damage_condition} onChange={e => setForm({...form, damage_condition: e.target.value})} placeholder="如：有污渍、破损" />
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
    </div>
  )
}

export default Collections
