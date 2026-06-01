import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Compliance() {
  const [reviews, setReviews] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = () => {
    axios.get(`/api/compliance-reviews?status=${statusFilter}`).then(res => setReviews(res.data))
  }

  const openReview = (review) => {
    setSelectedReview(review)
    setReviewNote('')
    setShowModal(true)
  }

  const handleReview = (result) => {
    axios.put(`/api/compliance-reviews/${selectedReview.id}`, {
      status: result,
      reviewer_id: 'comp001',
      review_notes: reviewNote
    }).then(() => {
      loadData()
      setShowModal(false)
    })
  }

  const getRiskTag = (level) => {
    const map = {
      high: <span className="tag tag-danger">高风险</span>,
      medium: <span className="tag tag-warning">中风险</span>,
      low: <span className="tag tag-info">低风险</span>
    }
    return map[level] || level
  }

  const getTypeLabel = (type) => {
    const map = {
      over_frequency: '超频拜访',
      location_abnormal: '定位异常',
      sensitive_material: '敏感资料'
    }
    return map[type] || type
  }

  const getStatusTag = (status) => {
    const map = {
      pending: <span className="tag tag-warning">待审核</span>,
      approved: <span className="tag tag-success">通过</span>,
      rejected: <span className="tag tag-danger">驳回</span>
    }
    return map[status] || status
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">合规审核</h1>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
          <option value="">全部</option>
        </select>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>风险类型</th>
              <th>风险等级</th>
              <th>描述</th>
              <th>涉及医生</th>
              <th>代表</th>
              <th>拜访日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr><td colSpan={8}><div className="empty">暂无风险记录</div></td></tr>
            ) : reviews.map(r => (
              <tr key={r.id}>
                <td>{getTypeLabel(r.risk_type)}</td>
                <td>{getRiskTag(r.risk_level)}</td>
                <td>{r.description}</td>
                <td>{r.doctor_name}</td>
                <td>{r.representative_name}</td>
                <td>{r.visit_date}</td>
                <td>{getStatusTag(r.status)}</td>
                <td>
                  {r.status === 'pending' && (
                    <button className="btn btn-sm btn-primary" onClick={() => openReview(r)}>审核</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">合规风险审核</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div><strong>风险类型：</strong>{getTypeLabel(selectedReview.risk_type)}</div>
                <div><strong>风险等级：</strong>{getRiskTag(selectedReview.risk_level)}</div>
              </div>
              <div className="form-row">
                <div><strong>医生：</strong>{selectedReview.doctor_name}</div>
                <div><strong>代表：</strong>{selectedReview.representative_name}</div>
              </div>
              <div className="form-group">
                <strong>风险描述：</strong>
                <p style={{ marginTop: 4, padding: 12, background: '#fff2f0', borderRadius: 4 }}>{selectedReview.description}</p>
              </div>
              <div className="form-group">
                <label className="form-label">审核意见</label>
                <textarea className="form-textarea" rows={3} value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="请输入审核意见" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={() => handleReview('rejected')}>驳回</button>
              <button className="btn btn-primary" onClick={() => handleReview('approved')}>通过</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Compliance
