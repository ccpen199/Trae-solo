import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function LinenItems() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({
    asset_number: '',
    category: '床单',
    specification: '标准',
    room_type: '标间',
    lifespan_months: 12,
    status: 'available'
  })

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    const data = await api.get('/linen-items')
    setItems(data)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editingItem) {
      api.put(`/linen-items/${editingItem.id}`, form).then(() => {
        loadItems()
        closeModal()
      })
    } else {
      api.post('/linen-items', form).then(() => {
        loadItems()
        closeModal()
      })
    }
  }

  function openEdit(item) {
    setEditingItem(item)
    setForm(item)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingItem(null)
    setForm({
      asset_number: '',
      category: '床单',
      specification: '标准',
      room_type: '标间',
      lifespan_months: 12,
      status: 'available'
    })
  }

  const statusLabels = {
    available: '可用',
    in_wash: '洗涤中',
    in_use: '使用中',
    scrapped: '已报损',
    lost: '已遗失'
  }

  return (
    <div>
      <div className="page-header">
        <h2>📋 布草档案</h2>
        <button className="btn btn-primary" onClick={closeModal}>+ 新增布草</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>资产编号</th>
              <th>品类</th>
              <th>规格</th>
              <th>适用房型</th>
              <th>使用寿命(月)</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.asset_number}</td>
                <td>{item.category}</td>
                <td>{item.specification}</td>
                <td>{item.room_type}</td>
                <td>{item.lifespan_months}</td>
                <td>
                  <span className={`status-badge status-${item.status}`}>
                    {statusLabels[item.status]}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h3>{editingItem ? '编辑布草' : '新增布草'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>资产编号</label>
                  <input
                    type="text"
                    value={form.asset_number}
                    onChange={e => setForm({...form, asset_number: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>品类</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option>床单</option>
                    <option>被套</option>
                    <option>枕套</option>
                    <option>毛巾</option>
                    <option>浴巾</option>
                    <option>地巾</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>规格</label>
                  <input
                    type="text"
                    value={form.specification}
                    onChange={e => setForm({...form, specification: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>适用房型</label>
                  <select value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})}>
                    <option>标间</option>
                    <option>大床房</option>
                    <option>套房</option>
                    <option>总统套房</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>使用寿命(月)</label>
                  <input
                    type="number"
                    value={form.lifespan_months}
                    onChange={e => setForm({...form, lifespan_months: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="available">可用</option>
                    <option value="in_wash">洗涤中</option>
                    <option value="in_use">使用中</option>
                    <option value="scrapped">已报损</option>
                    <option value="lost">已遗失</option>
                  </select>
                </div>
              </div>
              {(form.status === 'scrapped' || form.status === 'lost') && (
                <div className="form-group">
                  <label>{form.status === 'scrapped' ? '报损原因' : '遗失原因'}</label>
                  <textarea
                    value={form.status === 'scrapped' ? (form.scrap_reason || '') : (form.loss_reason || '')}
                    onChange={e => setForm({
                      ...form,
                      [form.status === 'scrapped' ? 'scrap_reason' : 'loss_reason']: e.target.value
                    })}
                  />
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LinenItems
