import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext.jsx'

function DamageApproval() {
  const [reports, setReports] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadReports()
    }
  }, [activeTab, user])

  async function loadReports() {
    if (!user) return
    try {
      setLoading(true)
      const url = activeTab === 'pending' ? '/damage-reports/pending' : '/damage-reports'
      const data = await api.get(url)
      setReports(data)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  function approveReport(id) {
    if (confirm('确定批准此报损？')) {
      api.put(`/damage-reports/${id}/approve`, { approver: user.name }).then(loadReports)
    }
  }

  function rejectReport(id) {
    const remarks = prompt('请输入拒绝原因：')
    if (remarks) {
      api.put(`/damage-reports/${id}/reject`, { approver: user.name, remarks }).then(loadReports)
    }
  }

  const statusLabels = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }

  return (
    <div>
      <div className="page-header">
        <h2>✅ 报损审批</h2>
      </div>

      <div className="alert alert-info">
        👤 当前用户：{user?.name}（{user?.role === 'manager' ? '部门经理' : '系统管理员'}）- 报损审批权限
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pending')}
          >
            待审批 ({reports.filter(r => r.approval_status === 'pending').length})
          </button>
          <button
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('all')}
          >
            全部报损
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>报损日期</th>
              <th>布草品类</th>
              <th>数量</th>
              <th>报损原因</th>
              <th>上报人</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td>{r.report_date}</td>
                <td>{r.linen_category}</td>
                <td>{r.quantity}</td>
                <td>{r.reason}</td>
                <td>{r.reporter}</td>
                <td>
                  <span className={`status-badge status-${r.approval_status}`}>
                    {statusLabels[r.approval_status]}
                  </span>
                </td>
                <td>
                  {r.approval_status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => approveReport(r.id)}>批准</button>
                      <button className="btn btn-sm btn-danger" style={{ marginLeft: '4px' }} onClick={() => rejectReport(r.id)}>拒绝</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280' }}>
                  {activeTab === 'pending' ? '暂无待审批报损' : '暂无报损记录'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DamageApproval
