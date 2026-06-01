import { useState, useEffect } from 'react'
import CreateApplicationModal from './CreateApplicationModal'
import { useUser } from '../contexts/UserContext'

function ApplicationList({ onSelectApplication, onApplicationCreated, showReviewActions = false, canCreateApplication = true }) {
  const { currentUser } = useUser()
  const canReview = showReviewActions && (currentUser.role === 'reviewer' || currentUser.role === 'admin')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [statusFilter, currentUser])

  const fetchApplications = async () => {
    try {
      const url = statusFilter 
        ? `/api/applications?status=${statusFilter}`
        : '/api/applications'
      const response = await fetch(url)
      const data = await response.json()
      let apps = data.data || []
      
      if (currentUser.role === 'applicant') {
        apps = apps.filter(app => app.applicant_name === currentUser.name)
      }
      
      setApplications(apps)
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
      case 'approved': return '通过'
      case 'rejected': return '拒绝'
      case 'pending_review': return '待复核'
      default: return '处理中'
    }
  }

  if (loading) {
    return <div className="card">加载中...</div>
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>{showReviewActions ? '信审工作台' : '申请列表'}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
          >
            <option value="">全部状态</option>
            <option value="approved">通过</option>
            <option value="rejected">拒绝</option>
            <option value="pending_review">待复核</option>
          </select>
          {!showReviewActions && canCreateApplication && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + 新建申请
            </button>
          )}
          {showReviewActions && (
            <span className={`status-badge status-review`}>
              待审核: {applications.filter(a => a.status === 'pending_review').length} 件
            </span>
          )}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>申请编号</th>
            <th>申请人</th>
            <th>身份证号</th>
            <th>手机号</th>
            <th>风险评分</th>
            <th>状态</th>
            <th>申请时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              className="table-row"
              onClick={(e) => {
                if (!e.target.closest('button')) {
                  onSelectApplication(app.id)
                }
              }}
            >
              <td style={{ fontFamily: 'monospace' }}>{app.id}</td>
              <td>{app.applicant_name}</td>
              <td>{app.id_card.replace(/^(.{6})(.*)(.{4})$/, '$1********$3')}</td>
              <td>{app.phone.replace(/^(.{3})(.*)(.{4})$/, '$1****$3')}</td>
              <td>
                <span style={{ 
                  color: app.risk_score >= 80 ? '#52c41a' : app.risk_score >= 60 ? '#faad14' : '#ff4d4f',
                  fontWeight: 'bold'
                }}>
                  {app.risk_score}
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
                    查看
                  </button>
                  {canReview && app.status === 'pending_review' && (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await handleQuickReview(app.id, 'approve')
                        }}
                      >
                        通过
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={async (e) => {
                          e.stopPropagation()
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
          ))}
        </tbody>
      </table>

      {applications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          暂无申请数据
        </div>
      )}

      {showModal && (
        <CreateApplicationModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            onApplicationCreated()
          }}
        />
      )}
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
          note: decision === 'approve' ? '信审通过' : '信审拒绝'
        })
      })

      if (response.ok) {
        alert(decision === 'approve' ? '审核通过成功' : '审核拒绝成功')
        fetchApplications()
      }
    } catch (error) {
      console.error('Failed to review:', error)
      alert('审核操作失败')
    }
  }
}

export default ApplicationList
