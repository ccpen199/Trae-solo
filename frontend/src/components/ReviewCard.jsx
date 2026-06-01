import React, { useState, useEffect } from 'react'

function ReviewCard({ review, currentUser, showComments, onToggleComments, onReviewUpdated, onReviewDeleted }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(review.likes_count || 0)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editContent, setEditContent] = useState(review.content)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = currentUser && parseInt(review.user_id) === parseInt(currentUser.id)

  useEffect(() => {
    if (showComments) {
      fetch(`/api/reviews/${review.id}`)
        .then(res => res.json())
        .then(data => {
          setComments(data.data?.comments || [])
        })
    }
  }, [showComments, review.id])

  const handleLike = () => {
    if (!currentUser) return

    fetch(`/api/reviews/${review.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id })
    })
      .then(res => res.json())
      .then(data => {
        setLiked(data.liked ? true : false)
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
      })
  }

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!currentUser || !commentText.trim()) return

    fetch(`/api/reviews/${review.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        content: commentText
      })
    })
      .then(res => res.json())
      .then(data => {
        setComments([...comments, { ...data.data, username: currentUser.username, avatar: currentUser.avatar }])
        setCommentText('')
      })
  }

  const handleDelete = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // 防止重复点击
    if (isDeleting) {
      console.log('删除操作正在进行中，忽略重复点击')
      return
    }

    const confirmed = window.confirm('确定要删除这条书评吗？')
    console.log('删除确认结果:', confirmed, '书评ID:', review.id)

    if (!confirmed) {
      console.log('用户取消删除')
      return
    }

    console.log('用户确认删除，执行删除操作')
    setIsDeleting(true)

    // 保存当前 id，防止异步执行时 review 对象变化
    const currentReviewId = review.id

    fetch(`/api/reviews/${currentReviewId}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error('删除失败')
        alert('删除成功！')
        if (onReviewDeleted) {
          onReviewDeleted(currentReviewId)
        }
      })
      .catch(err => {
        alert('删除失败：' + err.message)
        setIsDeleting(false)
      })
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editContent.trim()) return

    fetch(`/api/reviews/${review.id}`, {
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
        setIsEditing(false)
        if (onReviewUpdated) {
          onReviewUpdated(data.data)
        }
        alert('保存成功！')
      })
      .catch(err => {
        alert('保存失败：' + err.message)
      })
  }

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

  return (
    <div className="review-card">
      <div className="review-header">
        <img src={review.avatar} alt="" className="review-avatar" />
        <div className="review-user">
          <div className="review-username">{review.username}</div>
          <div className="review-date">{new Date(review.created_at).toLocaleDateString()}</div>
        </div>
        <div className="review-rating">{renderStars(review.rating)}</div>
      </div>

      {isEditing ? (
        <form className="review-form" onSubmit={handleEditSubmit}>
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>取消</button>
          </div>
        </form>
      ) : (
        <p className="review-content">{review.content}</p>
      )}

      {!isEditing && (
        <div className="review-actions">
          <button
            type="button"
            className={`action-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            ❤️ {likeCount}
          </button>
          <button type="button" className="action-btn" onClick={onToggleComments}>
            💬 {comments.length || review.comments_count || 0}
          </button>
          {isOwner && (
            <>
              <button type="button" className="action-btn" onClick={() => setIsEditing(true)}>
                ✏️ 编辑
              </button>
              <button type="button" className="action-btn" style={{ color: '#e74c3c' }} onClick={handleDelete} disabled={isDeleting}>
                🗑️ {isDeleting ? '删除中...' : '删除'}
              </button>
            </>
          )}
        </div>
      )}

      {showComments && (
        <div className="comment-form">
          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <img src={comment.avatar} alt="" className="comment-avatar" />
                  <div className="comment-content">
                    <div className="comment-username">{comment.username}</div>
                    <div className="comment-text">{comment.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUser && (
            <form onSubmit={handleCommentSubmit}>
              <input
                type="text"
                className="comment-input"
                placeholder="写下你的评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="comment-submit">发送</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default ReviewCard
