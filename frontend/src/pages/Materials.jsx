import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Materials() {
  const [materials, setMaterials] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '', type: 'document', category: 'product', is_sensitive: false, description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    axios.get('/api/materials').then(res => setMaterials(res.data))
  }

  const handleSubmit = () => {
    axios.post('/api/materials', formData).then(() => {
      loadData()
      setShowModal(false)
      setFormData({ name: '', type: 'document', category: 'product', is_sensitive: false, description: '' })
    })
  }

  const getCategoryLabel = (cat) => {
    const map = { product: '产品资料', research: '临床研究', education: '患者教育', other: '其他' }
    return map[cat] || cat
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学术资料管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增资料</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>资料名称</th>
              <th>类型</th>
              <th>分类</th>
              <th>敏感等级</th>
              <th>描述</th>
              <th>上传时间</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(m => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.type === 'document' ? '文档' : m.type}</td>
                <td>{getCategoryLabel(m.category)}</td>
                <td>{m.is_sensitive ? <span className="tag tag-danger">敏感</span> : <span className="tag tag-success">普通</span>}</td>
                <td>{m.description || '-'}</td>
                <td>{m.created_at?.substring(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">新增学术资料</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">资料名称</label>
                <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">资料类型</label>
                  <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="document">文档</option>
                    <option value="video">视频</option>
                    <option value="ppt">PPT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">资料分类</label>
                  <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="product">产品资料</option>
                    <option value="research">临床研究</option>
                    <option value="education">患者教育</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={formData.is_sensitive} onChange={e => setFormData({ ...formData, is_sensitive: e.target.checked })} />
                  &nbsp; 标记为敏感资料（需要合规审核）
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">资料描述</label>
                <textarea className="form-textarea" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Materials
