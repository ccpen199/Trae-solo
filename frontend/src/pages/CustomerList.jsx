import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { customers, common } from '../api'

export default function CustomerList({ currentUser }) {
  const [customerList, setCustomerList] = useState([])
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '', id_card: '', phone: '', email: '', 
    marital_status: 'single', address: '', loan_product_id: '', loan_amount: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [custData, prodData] = await Promise.all([
      customers.getAll(),
      common.getProducts()
    ])
    setCustomerList(custData)
    setProducts(prodData)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await customers.create({ ...formData, created_by: currentUser.id })
    setShowForm(false)
    setFormData({ name: '', id_card: '', phone: '', email: '', marital_status: 'single', address: '', loan_product_id: '', loan_amount: '' })
    loadData()
  }

  const statusConfig = {
    pending: { label: '资料收集中', class: 'status-pending' },
    reviewing: { label: '审批中', class: 'status-reviewing' },
    approved: { label: '已通过', class: 'status-approved' },
    rejected: { label: '已退回', class: 'status-rejected' }
  }

  return (
    <div className="customer-list">
      <div className="page-header">
        <h2>👥 客户管理</h2>
        {currentUser?.role === 'manager' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 新增客户</button>
        )}
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>新增客户</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>客户姓名 *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>身份证号 *</label>
                  <input required value={formData.id_card} onChange={e => setFormData({...formData, id_card: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>电子邮箱</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>婚姻状况</label>
                  <select value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})}>
                    <option value="single">未婚</option>
                    <option value="married">已婚</option>
                    <option value="divorced">离异</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>居住地址</label>
                  <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>贷款产品 *</label>
                  <select required value={formData.loan_product_id} onChange={e => setFormData({...formData, loan_product_id: e.target.value})}>
                    <option value="">请选择</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>申请金额（元）</label>
                  <input type="number" value={formData.loan_amount} onChange={e => setFormData({...formData, loan_amount: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>客户姓名</th>
              <th>身份证号</th>
              <th>贷款产品</th>
              <th>申请金额</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {customerList.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.id_card}</td>
                <td>{c.product_name}</td>
                <td>¥{Number(c.loan_amount || 0).toLocaleString()}</td>
                <td><span className={`status-tag ${statusConfig[c.status]?.class}`}>{statusConfig[c.status]?.label}</span></td>
                <td>{c.creator_name}</td>
                <td>{new Date(c.created_at).toLocaleString()}</td>
                <td>
                  <Link to={`/customers/${c.id}`} className="btn btn-small">查看详情</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customerList.length === 0 && (
          <div className="empty-state">暂无客户数据，点击右上角"新增客户"开始</div>
        )}
      </div>
    </div>
  )
}
