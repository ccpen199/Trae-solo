import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'

function RiskCheckPanel({ onSelectApplication, refreshKey }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const { currentUser } = useUser()

  useEffect(() => {
    fetchApplications()
  }, [refreshKey, filter, currentUser])

  const fetchApplications = async () => {
    try {
      let url = '/api/applications'
      if (filter === 'pending') {
        url = '/api/applications?status=pending_review'
      } else if (filter === 'all') {
        url = '/api/applications'
      }
      const response = await fetch(url)
      const data = await response.json()
      setApplications(data.data || [])
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved'
      case 'rejected': return 'status-rejected'
      case 'pending_review': return 'status-review'
      default: return 'status-pending'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '已通过'
      case 'rejected': return '已拒绝'
      case 'pending_review': return '待复核'
      default: return '处理中'
    }
  }

  const getRiskLevel = (score) => {
    if (score >= 80) return { text: '低风险', color: '#52c41a', bg: '#f6ffed' }
    if (score >= 60) return { text: '中风险', color: '#faad14', bg: '#fffbe6' }
    return { text: '高风险', color: '#ff4d4f', bg: '#fff2f0' }
  }

  if (loading) {
    return <div className="card">加载中...</div>
  }

  const pendingCount = applications.filter(a => a.status === 'pending_review').length

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>风控复核工作台</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
            >
              <option value="pending">待复核</option>
              <option value="all">全部申请</option>
            </select>
            <span className={`status-badge ${pendingCount > 0 ? 'status-review' : 'status-pending'}`}>
              待处理: {pendingCount} 件
            </span>
          </div>
        </div>

        <div className="risk-stats">
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#1890ff' }}>
              {applications.filter(a => a.status === 'pending_review').length}
            </div>
            <div className="stat-label">待复核</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>
              {applications.filter(a => a.status === 'approved').length}
            </div>
            <div className="stat-label">已通过</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>
              {applications.filter(a => a.status === 'rejected').length}
            </div>
            <div className="stat-label">已拒绝</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#faad14' }}>
              {applications.length}
            </div>
            <div className="stat-label">总计</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>待处理申请列表</h3>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无申请数据
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>申请编号</th>
                <th>申请人</th>
                <th>风险评分</th>
                <th>风险等级</th>
                <th>状态</th>
                <th>申请时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const riskLevel = getRiskLevel(app.risk_score)
                return (
                  <tr key={app.id}>
                    <td style={{ fontFamily: 'monospace' }}>{app.id}</td>
                    <td>{app.applicant_name}</td>
                    <td>
                      <span style={{ 
                        color: riskLevel.color,
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        {app.risk_score}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: riskLevel.bg, color: riskLevel.color, borderColor: riskLevel.color }}
                      >
                        {riskLevel.text}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(app.status)}`}>
                        {getStatusText(app.status)}
                      </span>
                    </td>
                    <td>{new Date(app.created_at).toLocaleString('zh-CN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onSelectApplication(app.id)}
                        >
                          查看详情
                        </button>
                        {app.status === 'pending_review' && (currentUser.role === 'risk' || currentUser.role === 'admin') && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={async () => {
                                await handleQuickReview(app.id, 'approve')
                              }}
                            >
                              通过
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={async () => {
                                await handleQuickReview(app.id, 'reject')
                              }}
                            >
                              拒绝
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )

  async function handleQuickReview(applicationId, decision) {
    try {
      const response = await fetch(`/api/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: currentUser.id,
          decision,
          note: decision === 'approve' ? '风控复核通过' : '风控复核拒绝'
        })
      })

      if (response.ok) {
        alert(decision === 'approve' ? '复核通过成功' : '复核拒绝成功')
        fetchApplications()
      }
    } catch (error) {
      console.error('Failed to review:', error)
      alert('复核操作失败')
    }
  }
}

export default RiskCheckPanel
