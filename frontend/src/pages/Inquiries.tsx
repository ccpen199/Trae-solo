import { useEffect, useState } from 'react'
import { inquiriesAPI, customersAPI, warehousesAPI } from '../api'

interface Inquiry {
  id: number
  customer_id: number
  customer_name: string
  customer_company: string
  area_required: number
  lease_term: number
  budget: number
  cargo_type: string
  special_requirements: string
  status: string
  created_at: string
}

interface Match {
  id: number
  warehouse_id: number
  warehouse_name: string
  warehouse_code: string
  area: number
  monthly_rent: number
  match_score: number
  match_reason: string
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: 0,
    area_required: 0,
    lease_term: 12,
    budget: 0,
    cargo_type: '',
    special_requirements: '',
  })

  useEffect(() => {
    loadInquiries()
    loadCustomers()
  }, [])

  const loadInquiries = async () => {
    try {
      const res = await inquiriesAPI.getAll()
      setInquiries(res.data)
    } catch (error) {
      console.error('加载询价列表失败:', error)
    }
  }

  const loadCustomers = async () => {
    try {
      const res = await customersAPI.getAll()
      setCustomers(res.data)
    } catch (error) {
      console.error('加载客户列表失败:', error)
    }
  }

  const handleMatch = async (id: number) => {
    try {
      const res = await inquiriesAPI.match(id)
      setMatches(res.data.matches)
      setShowMatchModal(true)
      loadInquiries()
    } catch (error) {
      console.error('匹配失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await inquiriesAPI.create(formData)
      setShowModal(false)
      resetForm()
      loadInquiries()
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败')
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      area_required: 0,
      lease_term: 12,
      budget: 0,
      cargo_type: '',
      special_requirements: '',
    })
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待匹配',
      matched: '已匹配',
      converted: '已成交',
      closed: '已关闭',
    }
    return map[status] || status
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-high'
    if (score >= 60) return 'score-medium'
    return 'score-low'
  }

  return (
    <div>
      <div className="page-header">
        <h1>客户询价管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          + 新增询价
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>客户</th>
                <th>公司</th>
                <th>需求面积(㎡)</th>
                <th>租期(月)</th>
                <th>预算(元/月)</th>
                <th>货物类型</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id}>
                  <td>{i.customer_name}</td>
                  <td>{i.customer_company}</td>
                  <td>{i.area_required}</td>
                  <td>{i.lease_term}</td>
                  <td>{i.budget}</td>
                  <td>{i.cargo_type || '-'}</td>
                  <td>
                    <span className={`status-badge status-${i.status}`}>
                      {getStatusText(i.status)}
                    </span>
                  </td>
                  <td>{i.created_at?.split('T')[0]}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleMatch(i.id)}>
                        智能匹配
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
              <h3>新增询价</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>客户</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>请选择客户</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.company}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>需求面积(㎡)</label>
                    <input
                      type="number"
                      value={formData.area_required}
                      onChange={(e) => setFormData({ ...formData, area_required: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>租期(月)</label>
                    <input
                      type="number"
                      value={formData.lease_term}
                      onChange={(e) => setFormData({ ...formData, lease_term: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>预算(元/月)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>货物类型</label>
                  <select
                    value={formData.cargo_type}
                    onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="普通货物">普通货物</option>
                    <option value="冷藏货物">冷藏货物</option>
                    <option value="冷链货物">冷链货物</option>
                    <option value="化工品">化工品</option>
                    <option value="危险品">危险品</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>特殊要求</label>
                  <textarea
                    rows={3}
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                  />
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

      {showMatchModal && (
        <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>智能匹配结果</h3>
              <button className="modal-close" onClick={() => setShowMatchModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>仓库</th>
                    <th>面积(㎡)</th>
                    <th>月租(元/㎡)</th>
                    <th>匹配度</th>
                    <th>匹配说明</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id}>
                      <td>{m.warehouse_name}</td>
                      <td>{m.area}</td>
                      <td>{m.monthly_rent}</td>
                      <td>
                        <span className={`match-score ${getScoreClass(m.match_score)}`}>
                          {m.match_score}%
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#595959' }}>{m.match_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
