import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    fetch('/api/books')
      .then(res => {
        if (!res.ok) throw new Error('网络错误')
        return res.json()
      })
      .then(data => {
        setBooks(data.data || [])
        setError(null)
      })
      .catch(err => {
        setError(err.message)
        setBooks([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const renderStars = (rating) => {
    const stars = []
    const rounded = Math.round(rating)
    for (let i = 0; i < 5; i++) {
      stars.push(<span key={i}>{i < rounded ? '★' : '☆'}</span>)
    }
    return stars
  }

  if (loading) {
    return (
      <div className="container">
        <div className="book-list">
          <h1 className="page-title">精选好书</h1>
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-text">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="book-list">
          <h1 className="page-title">精选好书</h1>
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <p className="empty-state-text">加载失败: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="book-list">
        <h1 className="page-title">精选好书</h1>
        {books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <p className="empty-state-text">暂无书籍</p>
          </div>
        ) : (
          <div className="books-grid">
              {books.map(book => (
              <div
                key={book.id}
                className="book-card"
                onClick={() => navigate(`/book/${book.id}`)}
              >
                <img src={book.cover} alt={book.title} className="book-cover" />
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <div className="book-price-row">
                    <div>
                      <span className="book-price">¥{book.price.toFixed(2)}</span>
                      {book.original_price && (
                        <span className="book-original-price">¥{book.original_price.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="book-rating">
                      {renderStars(book.avg_rating || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
