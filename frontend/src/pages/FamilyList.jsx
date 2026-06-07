import React, { useState, useEffect } from 'react'
import { familyApi } from '../services/api.js'

function FamilyList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    main_insured_id: '',
    family_member_id: '',
    relation: '配偶'
  })

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await familyApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await familyApi.create(formData)
      setShowModal(false)
      loadData()
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleCancel = async (id) => {
    if (confirm('确定要取消该家庭共济授权吗？')) {
      try {
        await familyApi.cancel(id)
        loadData()
      } catch (error) {
        console.error('取消失败:', error)
      }
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>👨‍👩‍👧‍👦 家庭共济账户</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增授权
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>主账户人</th>
                <th>家庭成员</th>
                <th>成员身份证</th>
                <th>关系</th>
                <th>授权日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.main_name}</td>
                  <td>{item.member_name}</td>
                  <td>{item.member_id_card}</td>
                  <td>{item.relation}</td>
                  <td>{item.auth_date?.slice(0, 10)}</td>
                  <td>
                    <span className={`badge ${item.auth_status === '已授权' ? 'badge-success' : 'badge-default'}`}>
                      {item.auth_status}
                    </span>
                  </td>
                  <td>
                    {item.auth_status === '已授权' && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleCancel(item.id)}>
                        取消授权
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>新增家庭共济授权</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>主账户人ID</label>
                  <input required value={formData.main_insured_id} onChange={e => setFormData({...formData, main_insured_id: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>家庭成员ID</label>
                  <input required value={formData.family_member_id} onChange={e => setFormData({...formData, family_member_id: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>亲属关系</label>
                  <select value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})}>
                    <option value="配偶">配偶</option>
                    <option value="子女">子女</option>
                    <option value="父母">父母</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">授权</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyList
