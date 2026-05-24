import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { reviewAPI } from '../api'

export default function Reviews({ user }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    appointmentId: '',
    rating: 5,
    content: '',
    images: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const loadReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {}
      const res = await reviewAPI.getReviews(params)
      setReviews(res.data || [])
    } catch (err) {
      setError('加载评价列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [activeTab])

  const handleCreateReview = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await reviewAPI.createReview(formData)
      setShowModal(false)
      setFormData({ appointmentId: '', rating: 5, content: '', images: [] })
      loadReviews()
    } catch (err) {
      setError(err.response?.data?.error || '创建评价失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkRepurchase = async (id) => {
    try {
      await reviewAPI.markRepurchase(id)
      loadReviews()
    } catch (err) {
      setError('标记复购失败')
    }
  }

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const canCreate = user.role === 'owner'

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>评价管理</h2>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            发表评价
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部
        </div>
        <div className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          待评价
        </div>
        <div className={`tab ${activeTab === 'reviewed' ? 'active' : ''}`} onClick={() => setActiveTab('reviewed')}>
          已评价
        </div>
      </div>

      <div className="card">
        {reviews.length === 0 ? (
          <div className="empty-state">
            <h3>暂无评价</h3>
            <p>完成服务后可以对服务进行评价</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>服务项目</th>
                <th>评分</th>
                <th>评价内容</th>
                <th>评价时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.serviceName}</td>
                  <td>{review.rating ? renderStars(review.rating) : '-'}</td>
                  <td>{review.content || '-'}</td>
                  <td>{review.createdAt ? dayjs(review.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</td>
                  <td>
                    {review.reviewed ? (
                      <span className="badge badge-success">已评价</span>
                    ) : (
                      <span className="badge badge-warning">待评价</span>
                    )}
                    {review.repurchase && (
                      <span className="badge badge-info" style={{ marginLeft: '4px' }}>已复购</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {canCreate && !review.reviewed && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, appointmentId: review.appointmentId }))
                            setShowModal(true)
                          }}
                        >
                          去评价
                        </button>
                      )}
                      {review.reviewed && !review.repurchase && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleMarkRepurchase(review.id)}
                        >
                          标记复购
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发表评价</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateReview}>
              <div className="form-group">
                <label>评分</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  required
                >
                  <option value={5}>⭐⭐⭐⭐⭐ 非常满意</option>
                  <option value={4}>⭐⭐⭐⭐ 满意</option>
                  <option value={3}>⭐⭐⭐ 一般</option>
                  <option value={2}>⭐⭐ 不满意</option>
                  <option value={1}>⭐ 非常不满意</option>
                </select>
              </div>
              <div className="form-group">
                <label>评价内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="请输入您的评价..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '提交评价'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
