import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReviewCard from '../components/ReviewCard'

function BookDetailPage({ currentUser }) {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [reviews, setReviews] = useState([])
  const [newRating, setNewRating] = useState(5)
  const [newContent, setNewContent] = useState('')
  const [showComments, setShowComments] = useState({})

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then(res => res.json())
      .then(data => {
        setBook(data.data)
      })

    fetch(`/api/reviews?book_id=${id}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.data || [])
      })
  }, [id])

  const handleAddToCart = () => {
    if (!currentUser) return
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        book_id: book.id
      })
    }).then(() => {
      alert('已添加到购物袋')
    })
  }

  const handleBuy = () => {
    if (!currentUser) return
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        book_id: book.id
      })
    }).then(() => {
      alert('购买成功！')
    })
  }

  const handleSubmitReview = (e) => {
    e.preventDefault()
    if (!currentUser || !newContent.trim()) return

    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: book.id,
        user_id: currentUser.id,
        rating: newRating,
        content: newContent
      })
    })
      .then(res => res.json())
      .then(data => {
        setReviews([{ ...data.data, username: currentUser.username, avatar: currentUser.avatar }, ...reviews])
        setNewContent('')
        setNewRating(5)
      })
  }

  const handleReviewUpdated = (updatedReview) => {
    setReviews(reviews.map(r =>
      r.id === updatedReview.id ? { ...r, ...updatedReview } : r
    ))
  }

  const handleReviewDeleted = (reviewId) => {
    setReviews(reviews.filter(r => r.id !== reviewId))
  }

  if (!book) return <div className="container"><div style={{ padding: '40px 0' }}>加载中...</div></div>

  return (
    <div className="container">
      <div className="detail-page">
        <div className="book-detail">
          <img src={book.cover} alt={book.title} className="book-detail-cover" />
          <div className="book-detail-info">
            <h1 className="book-detail-title">{book.title}</h1>
            <p className="book-detail-author">{book.author}</p>
            <div className="book-meta">
              <div className="meta-item">
                <span className="meta-label">出版社</span>
                <span className="meta-value">{book.publisher || '未知'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">品相</span>
                <span className="meta-value">{book.condition || '良好'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">库存</span>
                <span className="meta-value">{book.stock} 本</span>
              </div>
            </div>
            <div className="book-detail-price">
              <span className="price-current">¥{book.price.toFixed(2)}</span>
              {book.original_price && (
                <span className="price-original">¥{book.original_price.toFixed(2)}</span>
              )}
            </div>
            <p className="book-description">{book.description}</p>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handleBuy}>立即购买</button>
              <button className="btn btn-outline" onClick={handleAddToCart}>加入购物袋</button>
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <div className="section-header">
            <h2 className="section-title">书友书评</h2>
            <span className="review-count">共 {reviews.length} 条</span>
          </div>

          {currentUser && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">评分</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= newRating ? 'active' : ''}`}
                      onClick={() => setNewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">写下你的书评</label>
                <textarea
                  className="textarea"
                  placeholder="分享你的阅读感受，帮助其他书友做出选择..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">发布书评</button>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-text">暂无书评，来做第一个评论者吧</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUser={currentUser}
                  showComments={showComments[review.id]}
                  onToggleComments={() => setShowComments({ ...showComments, [review.id]: !showComments[review.id] })}
                  onReviewUpdated={handleReviewUpdated}
                  onReviewDeleted={handleReviewDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookDetailPage
