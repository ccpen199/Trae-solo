import React, { useState, useEffect } from 'react'

function ProfilePage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('reviews')
  const [reviews, setReviews] = useState([])
  const [orders, setOrders] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    if (!currentUser) return

    if (activeTab === 'reviews') {
      fetch(`/api/users/${currentUser.id}/reviews`)
        .then(res => res.json())
        .then(data => {
          setReviews(data.data || [])
        })
    } else if (activeTab === 'orders') {
      fetch(`/api/orders?user_id=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data.data || [])
        })
    }
  }, [currentUser, activeTab])

  if (!currentUser) return <div className="container"><div style={{ padding: '40px 0' }}>加载中...</div></div>

  const renderStars = (rating, interactive = false, onChange = null) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`star-btn ${i < rating ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: interactive ? 'pointer' : 'default' }}
          onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
        >
          ★
        </button>
      )
    }
    return stars
  }

  const [deletingIds, setDeletingIds] = useState([])

  const handleDelete = (e, reviewId) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // 防止重复点击
    if (deletingIds.includes(reviewId)) {
      console.log('删除操作正在进行中，忽略重复点击，ID:', reviewId)
      return
    }

    const confirmed = window.confirm('确定要删除这条书评吗？')
    console.log('删除确认结果:', confirmed, '书评ID:', reviewId)

    if (!confirmed) {
      console.log('用户取消删除')
      return
    }

    console.log('用户确认删除，执行删除操作')
    setDeletingIds([...deletingIds, reviewId])

    fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error('删除失败')
        setReviews(reviews.filter(r => r.id !== reviewId))
        alert('删除成功！')
      })
      .catch(err => {
        alert('删除失败：' + err.message)
        setDeletingIds(deletingIds.filter(id => id !== reviewId))
      })
  }

  const startEdit = (review) => {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditContent(review.content)
  }

  const handleEditSubmit = (e, reviewId) => {
    e.preventDefault()
    if (!editContent.trim()) return

    fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: editRating,
        content: editContent
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('保存失败')
        return res.json()
      })
      .then(data => {
        setReviews(reviews.map(r =>
          r.id === reviewId ? { ...r, ...data.data } : r
        ))
        setEditingId(null)
        alert('保存成功！')
      })
      .catch(err => {
        alert('保存失败：' + err.message)
      })
  }

  return (
    <div className="container">
      <div className="profile-page">
        <div className="profile-header">
          <img src={currentUser.avatar} alt="" className="profile-avatar" />
          <div className="profile-info">
            <h1>{currentUser.username}</h1>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{reviews.length}</span>
                <span className="stat-label">书评</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{orders.length}</span>
                <span className="stat-label">订单</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            我的书评
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            我的订单
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <p className="empty-state-text">还没有写过书评</p>
              </div>
            ) : (
              <div>
                {reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <img src={currentUser.avatar} alt="" className="review-avatar" />
                      <div className="review-user">
                        <div className="review-username">{review.book_title}</div>
                        <div className="review-date">{new Date(review.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="review-rating">{renderStars(review.rating)}</div>
                    </div>

                    {editingId === review.id ? (
                      <form className="review-form" onSubmit={(e) => handleEditSubmit(e, review.id)}>
                        <div className="form-group">
                          <label className="form-label">修改评分</label>
                          <div className="rating-input">
                            {renderStars(editRating, true, setEditRating)}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">修改内容</label>
                          <textarea
                            className="textarea"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button type="submit" className="btn btn-primary">保存修改</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)}>取消</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="review-content">{review.content}</p>
                        <div className="review-actions">
                          <span className="action-btn">❤️ {review.likes_count || 0}</span>
                          <span className="action-btn">💬 {review.comments_count || 0}</span>
                          <button type="button" className="action-btn" onClick={() => startEdit(review)}>
                            ✏️ 编辑
                          </button>
                          <button type="button" className="action-btn" style={{ color: '#e74c3c' }} onClick={(e) => handleDelete(e, review.id)} disabled={deletingIds.includes(review.id)}>
                            🗑️ {deletingIds.includes(review.id) ? '删除中...' : '删除'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'orders' && (
            orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p className="empty-state-text">还没有订单</p>
              </div>
            ) : (
              <div>
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <img src={order.book_cover} alt="" className="order-book-cover" />
                    <div className="order-book-info">
                      <h3 className="order-book-title">{order.book_title}</h3>
                      <p className="order-book-author">{order.author}</p>
                      <span className="order-status">{order.status === 'completed' ? '已完成' : '处理中'}</span>
                    </div>
                    <div className="order-price">¥{order.total_price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
