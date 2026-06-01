import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [deletingSupplier, setDeletingSupplier] = useState(null)
  const [form, setForm] = useState({
    name: '',
    contact: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  async function loadSuppliers() {
    const data = await api.get('/suppliers')
    setSuppliers(data)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editingSupplier) {
      api.put(`/suppliers/${editingSupplier.id}`, form).then(() => {
        loadSuppliers()
        closeModal()
      })
    } else {
      api.post('/suppliers', form).then(() => {
        loadSuppliers()
        closeModal()
      })
    }
  }

  function openAdd() {
    setEditingSupplier(null)
    setForm({ name: '', contact: '', phone: '', address: '' })
    setShowModal(true)
  }

  function openEdit(supplier) {
    setEditingSupplier(supplier)
    setForm(supplier)
    setShowModal(true)
  }

  function openDelete(supplier) {
    setDeletingSupplier(supplier)
    setShowDeleteModal(true)
  }

  function confirmDelete() {
    if (deletingSupplier) {
      api.delete(`/suppliers/${deletingSupplier.id}`).then(() => {
        loadSuppliers()
        closeDeleteModal()
      })
    }
  }

  function closeModal() {
    setShowModal(false)
    setEditingSupplier(null)
    setForm({ name: '', contact: '', phone: '', address: '' })
  }

  function closeDeleteModal() {
    setShowDeleteModal(false)
    setDeletingSupplier(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2>🏢 供应商管理</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ 新增供应商</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>供应商名称</th>
              <th>联系人</th>
              <th>联系电话</th>
              <th>地址</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.contact}</td>
                <td>{s.phone}</td>
                <td>{s.address}</td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>编辑</button>
                  <button className="btn btn-sm btn-danger" style={{ marginLeft: '8px' }} onClick={() => openDelete(s)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h3>{editingSupplier ? '编辑供应商' : '新增供应商'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>供应商名称</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>联系人</label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={e => setForm({...form, contact: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '')})}
                    placeholder="请输入数字"
                    maxLength={11}
                  />
                </div>
                <div className="form-group">
                  <label>地址</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeDeleteModal()}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h3>⚠️ 确认删除</h3>
            <p style={{ margin: '16px 0 24px', color: '#6b7280' }}>
              确定要删除供应商 <strong style={{ color: '#dc2626' }}>"{deletingSupplier?.name}"</strong> 吗？
              <br />
              <span style={{ fontSize: '13px' }}>此操作不可撤销，关联的洗涤记录可能会受影响。</span>
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>取消</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Suppliers
