import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext.jsx'

function DamageReports() {
  const [reports, setReports] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [form, setForm] = useState({
    linen_category: '床单',
    quantity: 1,
    report_date: new Date().toISOString().split('T')[0],
    reason: '',
    reporter: '',
    remarks: ''
  })

  useEffect(() => {
    if (user) {
      setForm(prev => ({ ...prev, reporter: user.name }))
      loadReports()
    }
  }, [user])

  async function loadReports() {
    if (!user) return
    try {
      setLoading(true)
      const data = await api.get('/damage-reports')
      setReports(data.filter(r => r.reporter === user.name))
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    api.post('/damage-reports', form).then(() => {
      loadReports()
      setShowModal(false)
      setForm({
        linen_category: '床单',
        quantity: 1,
        report_date: new Date().toISOString().split('T')[0],
        reason: '',
        reporter: user?.name || '',
        remarks: ''
      })
    })
  }

  const statusLabels = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }

  return (
    <div>
      <div className="page-header">
        <h2>⚠️ 布草报损</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增报损</button>
      </div>

      <div className="alert alert-info">
        👤 当前用户：{user?.name}（{user?.role === 'staff' ? '客房员工' : user?.role === 'manager' ? '部门经理' : '系统管理员'}）- 报损上报权限
      </div>

      <div className="card">
        <h3>我的报损记录</h3>
        <table className="table">
          <thead>
            <tr>
              <th>报损日期</th>
              <th>布草品类</th>
              <th>数量</th>
              <th>报损原因</th>
              <th>审批人</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td>{r.report_date}</td>
                <td>{r.linen_category}</td>
                <td>{r.quantity}</td>
                <td>{r.reason}</td>
                <td>{r.approver || '-'}</td>
                <td>
                  <span className={`status-badge status-${r.approval_status}`}>
                    {statusLabels[r.approval_status]}
                  </span>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#6b7280' }}>暂无报损记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3>新增报损</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>布草品类</label>
                  <select value={form.linen_category} onChange={e => setForm({...form, linen_category: e.target.value})}>
                    <option>床单</option><option>被套</option><option>枕套</option><option>毛巾</option><option>浴巾</option><option>地巾</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>数量</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} min="1" required />
                </div>
                <div className="form-group">
                  <label>报损日期</label>
                  <input type="date" value={form.report_date} onChange={e => setForm({...form, report_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>上报人</label>
                  <input type="text" value={form.reporter} disabled />
                </div>
              </div>
              <div className="form-group">
                <label>报损原因</label>
                <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows="2" required />
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} rows="2" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交报损</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DamageReports
