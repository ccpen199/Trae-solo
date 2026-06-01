import { useState, useEffect } from 'react'
import RiskGraph from './RiskGraph'
import { useUser } from '../contexts/UserContext'

function ApplicationDetail({ applicationId, onBack, onReviewComplete }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('basic')
  const [reviewNote, setReviewNote] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const { currentUser } = useUser()

  useEffect(() => {
    fetchApplicationDetail()
  }, [applicationId, currentUser])

  const fetchApplicationDetail = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch application detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const canReview = (currentUser.role === 'reviewer' || currentUser.role === 'risk' || currentUser.role === 'admin')

  const handleReview = async (decision) => {
    if (!canReview) {
      alert('您没有审核权限')
      return
    }
    setSubmittingReview(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: currentUser.id,
          decision,
          note: reviewNote
        })
      })

      if (response.ok) {
        alert('复核成功')
        onReviewComplete()
        fetchApplicationDetail()
      } else {
        alert('复核失败')
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('复核失败')
    } finally {
      setSubmittingReview(false)
    }
  }

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high'
    if (score >= 60) return 'score-medium'
    return 'score-low'
  }

  const getVerifyTypeText = (type) => {
    switch (type) {
      case 'id_card': return '身份核验'
      case 'phone': return '手机号实名'
      case 'bank_card': return '银行卡核验'
      case 'device': return '设备指纹'
      default: return type
    }
  }

  if (loading || !data) {
    return <div className="card">加载中...</div>
  }

  const { application, verifications, blacklist_hits, contacts, devices, rule_hits, reviews } = data

  return (
    <div>
      <button className="back-button" onClick={onBack}>
        ← 返回列表
      </button>

      <div className="card">
        <div className="card-header">
          <h2>申请详情 - {application.id}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              申请人: <strong>{application.applicant_name}</strong>
            </span>
            <span className={`status-badge ${
              application.status === 'approved' ? 'status-approved' :
              application.status === 'rejected' ? 'status-rejected' :
              application.status === 'pending_review' ? 'status-review' : 'status-pending'
            }`}>
              {application.status === 'approved' ? '通过' :
               application.status === 'rejected' ? '拒绝' :
               application.status === 'pending_review' ? '待复核' : '处理中'}
            </span>
          </div>
        </div>

        <div className="tabs">
          <div
            className={`tab ${activeTab === 'basic' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            基本信息
          </div>
          <div
            className={`tab ${activeTab === 'verification' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            核验详情
          </div>
          <div
            className={`tab ${activeTab === 'risk' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            风险画像
          </div>
          <div
            className={`tab ${activeTab === 'graph' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            关联图谱
          </div>
          <div
            className={`tab ${activeTab === 'review' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            复核记录
          </div>
        </div>

        {activeTab === 'basic' && (
          <div>
            <div className="info-grid">
              <div className="info-item">
                <label>申请人姓名</label>
                <div>{application.applicant_name}</div>
              </div>
              <div className="info-item">
                <label>身份证号</label>
                <div>{application.id_card}</div>
              </div>
              <div className="info-item">
                <label>手机号</label>
                <div>{application.phone}</div>
              </div>
              <div className="info-item">
                <label>银行卡号</label>
                <div>{application.bank_card || '-'}</div>
              </div>
              <div className="info-item">
                <label>风险评分</label>
                <div style={{
                  color: application.risk_score >= 80 ? '#52c41a' :
                         application.risk_score >= 60 ? '#faad14' : '#ff4d4f',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {application.risk_score}
                </div>
              </div>
              <div className="info-item">
                <label>申请时间</label>
                <div>{new Date(application.created_at).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            {contacts && contacts.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>联系人信息</h3>
                {contacts.map((contact, index) => (
                  <div key={index} className="contact-item">
                    <div>
                      <strong>{contact.name}</strong>
                      <span style={{ marginLeft: '12px', color: '#666' }}>
                        {contact.relationship || '其他'}
                      </span>
                    </div>
                    <div>{contact.phone}</div>
                  </div>
                ))}
              </div>
            )}

            {devices && devices.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>设备信息</h3>
                {devices.map((device, index) => (
                  <div key={index} className="contact-item">
                    <div>
                      <strong>设备ID:</strong> {device.device_id}
                    </div>
                    <div>
                      <strong>IP:</strong> {device.ip_address || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="verification-grid">
            {verifications && verifications.map((v, index) => (
              <div key={index} className="verification-item">
                <div className={`verification-icon ${v.status === 'pass' ? 'verification-pass' : 'verification-fail'}`}>
                  {v.status === 'pass' ? '✓' : '✗'}
                </div>
                <div className="verification-info">
                  <h4>{getVerifyTypeText(v.verify_type)}</h4>
                  <p>来源: {v.source}</p>
                  <p>时间: {new Date(v.verified_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'risk' && (
          <div>
            <div className="score-display">
              <div className={`score-circle ${getScoreClass(application.risk_score)}`}>
                <span className="score-value">{application.risk_score}</span>
                <span className="score-label">
                  {application.risk_score >= 80 ? '低风险' :
                   application.risk_score >= 60 ? '中风险' : '高风险'}
                </span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <strong>系统决策: </strong>
                {application.final_decision === 'approve' ? '通过' :
                 application.final_decision === 'reject' ? '拒绝' : '人工复核'}
              </div>
            </div>

            {blacklist_hits && blacklist_hits.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#ff4d4f' }}>
                  ⚠️ 黑名单命中 ({blacklist_hits.length})
                </h3>
                {blacklist_hits.map((hit, index) => (
                  <div key={index} className="blacklist-item">
                    <div className="blacklist-header">
                      <span className="blacklist-type">
                        {getVerifyTypeText(hit.hit_type)}
                      </span>
                      <span className="blacklist-source">来源: {hit.source || '风控系统'}</span>
                    </div>
                    <div>命中值: {hit.hit_value}</div>
                    <div>匹配度: {(hit.match_score * 100).toFixed(0)}%</div>
                    <div style={{ marginTop: '8px' }}>
                      <span className={`status-badge ${hit.confirmed ? 'status-rejected' : 'status-pending'}`}>
                        {hit.confirmed ? '已确认' : '待确认'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rule_hits && rule_hits.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>
                  规则命中详情
                </h3>
                {rule_hits.map((hit, index) => (
                  <div key={index} className="rule-hit">
                    <div className="rule-hit-info">
                      <h4>{hit.rule_name} ({hit.rule_code})</h4>
                      <p>命中值: {hit.hit_value}</p>
                    </div>
                    <span className="rule-deduction">-{hit.score_deducted}分</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'graph' && (
          <div>
            <RiskGraph applicationId={applicationId} />
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            {application.status === 'pending_review' && canReview && (
              <div className="review-section">
                <h3>人工复核 - {currentUser.roleName}</h3>
                <div className="form-group">
                  <label>复核意见</label>
                  <textarea
                    rows="3"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="请输入复核意见..."
                  />
                </div>
                <div className="review-buttons">
                  <button
                    className="btn btn-success"
                    onClick={() => handleReview('approve')}
                    disabled={submittingReview}
                  >
                    ✓ 通过
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReview('reject')}
                    disabled={submittingReview}
                  >
                    ✗ 拒绝
                  </button>
                </div>
              </div>
            )}

            {application.status === 'pending_review' && !canReview && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                您没有审核权限，请切换到信审员或风控复核员账号
              </div>
            )}

            {reviews && reviews.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>复核历史</h3>
                {reviews.map((review, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>
                        复核人: <strong>{review.reviewer_id}</strong>
                      </span>
                      <span className={`status-badge ${
                        review.new_decision === 'approve' ? 'status-approved' : 'status-rejected'
                      }`}>
                        {review.new_decision === 'approve' ? '通过' : '拒绝'}
                      </span>
                    </div>
                    {review.review_note && (
                      <p style={{ color: '#666', marginBottom: '8px' }}>
                        意见: {review.review_note}
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(review.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(!reviews || reviews.length === 0) && application.status !== 'pending_review' && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无复核记录
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetail
