import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { insuredApi } from '../services/api.js'

function InsuredList() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    id_card: '',
    name: '',
    gender: '男',
    birth_date: '',
    phone: '',
    address: '',
    insurance_type: '职工医保',
    insurance_area: '',
    insured_date: '',
    balance: 0
  })

  useEffect(() => {
    loadData()
  }, [page, keyword])

  const loadData = async () => {
    try {
      const data = await insuredApi.getList({ page, pageSize, keyword })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await insuredApi.create(formData)
      setShowModal(false)
      loadData()
      resetForm()
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.error || error.message))
    }
  }

  const resetForm = () => {
    setFormData({
      id_card: '',
      name: '',
      gender: '男',
      birth_date: '',
      phone: '',
      address: '',
      insurance_type: '职工医保',
      insurance_area: '',
      insured_date: '',
      balance: 0
    })
  }

  const handleDelete = async (id, name) => {
    if (confirm(`确定要删除参保人"${name}"吗？`)) {
      try {
        await insuredApi.delete(id)
        loadData()
      } catch (error) {
        console.error('删除失败:', error)
      }
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>👤 参保人管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增参保人
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索姓名、身份证号、医保卡号..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
            <button className="btn btn-primary" onClick={loadData}>搜索</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>医保卡号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>身份证号</th>
                <th>参保类型</th>
                <th>参保地</th>
                <th>账户余额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.medical_card_number}</td>
                  <td>{item.name}</td>
                  <td>{item.gender}</td>
                  <td>{item.id_card}</td>
                  <td>{item.insurance_type}</td>
                  <td>{item.insurance_area}</td>
                  <td>¥{item.balance?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${item.status === '正常参保' ? 'badge-success' : 'badge-default'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-default" onClick={() => navigate(`/insured/${item.id}`)}>
                      详情
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id, item.name)} style={{ marginLeft: '8px' }}>
                      删除
                    </button>
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
          <div className="modal-content">
            <div className="modal-header">
              <h2>新增参保人</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名 *</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>身份证号 *</label>
                    <input required value={formData.id_card} onChange={e => setFormData({...formData, id_card: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>性别</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>出生日期</label>
                    <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>联系电话</label>
                    <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>参保类型</label>
                    <select value={formData.insurance_type} onChange={e => setFormData({...formData, insurance_type: e.target.value})}>
                      <option value="职工医保">职工医保</option>
                      <option value="居民医保">居民医保</option>
                      <option value="新农合">新农合</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>参保地</label>
                  <input value={formData.insurance_area} onChange={e => setFormData({...formData, insurance_area: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>联系地址</label>
                  <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>参保日期</label>
                    <input type="date" value={formData.insured_date} onChange={e => setFormData({...formData, insured_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>账户余额</label>
                    <input type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InsuredList
