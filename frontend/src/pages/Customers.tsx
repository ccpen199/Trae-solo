import { useEffect, useState } from 'react'
import { customersAPI } from '../api'

interface Customer {
  id: number
  name: string
  contact: string
  phone: string
  email: string
  industry: string
  company: string
  created_at: string
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    industry: '',
    company: '',
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const res = await customersAPI.getAll()
      setCustomers(res.data)
    } catch (error) {
      console.error('加载客户列表失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData)
      } else {
        await customersAPI.create(formData)
      }
      setShowModal(false)
      setEditingCustomer(null)
      resetForm()
      loadCustomers()
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败')
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      contact: customer.contact,
      phone: customer.phone,
      email: customer.email,
      industry: customer.industry,
      company: customer.company,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个客户吗？')) {
      try {
        await customersAPI.delete(id)
        loadCustomers()
      } catch (error) {
        console.error('删除客户失败:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      phone: '',
      email: '',
      industry: '',
      company: '',
    })
  }

  return (
    <div>
      <div className="page-header">
        <h1>客户管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setEditingCustomer(null)
            setShowModal(true)
          }}
        >
          + 新增客户
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>客户名称</th>
                <th>公司</th>
                <th>行业</th>
                <th>联系人</th>
                <th>电话</th>
                <th>邮箱</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.company}</td>
                  <td>{c.industry}</td>
                  <td>{c.contact}</td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
                  <td>{c.created_at?.split('T')[0]}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-default btn-sm" onClick={() => handleEdit(c)}>
                        编辑
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCustomer ? '编辑客户' : '新增客户'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>客户名称</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>公司</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>行业</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="电商零售">电商零售</option>
                      <option value="冷链物流">冷链物流</option>
                      <option value="化工">化工</option>
                      <option value="制造业">制造业</option>
                      <option value="医药">医药</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>联系人</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>电话</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>邮箱</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
