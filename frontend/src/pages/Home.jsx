import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../store/auth'
import LoginModal from '../components/LoginModal'
import { useToast } from '../components/Toast'

const Home = () => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  const fetchQuestions = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      const res = await client.get(`/questions?page=${pageNum}&limit=10`)
      if (res.data.success) {
        const newList = res.data.data.list
        if (reset) {
          setQuestions(newList)
        } else {
          setQuestions(prev => [...prev, ...newList])
        }
        setHasMore(newList.length >= 10)
      }
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions(1, true)
  }, [])

  const handleRefresh = () => {
    setPage(1)
    fetchQuestions(1, true)
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchQuestions(nextPage)
    }
  }

  const handleFollow = async (questionId) => {
    if (!user) {
      setShowLogin(true)
      return
    }
    try {
      const res = await client.post(`/questions/${questionId}/follow`)
      if (res.data.success) {
        showToast(res.data.message, 'success')
        setQuestions(prev => prev.map(q =>
          q.id === questionId
            ? { ...q, is_followed: res.data.data.is_followed, follow_count: q.follow_count + (res.data.data.is_followed ? 1 : -1) }
            : q
        ))
      }
    } catch (err) {
      showToast(err.response?.data?.message || '操作失败', 'error')
    }
  }

  if (loading && page === 1) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>加载中...</p>
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.retryBtn} onClick={handleRefresh}>重试</button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>推荐</h1>
        <button style={styles.refreshBtn} onClick={handleRefresh}>刷新</button>
      </div>

      {questions.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>📝</div>
          <p style={styles.emptyText}>暂无内容</p>
        </div>
      ) : (
        <>
          <div style={styles.list}>
            {questions.map(q => (
              <Link key={q.id} to={`/question/${q.id}`} style={styles.itemLink}>
                <div style={styles.item}>
                  <div style={styles.itemHeader}>
                    <img
                      src={q.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${q.id}`}
                      alt="avatar"
                      style={styles.avatar}
                    />
                    <div style={styles.userInfo}>
                      <span style={styles.nickname}>{q.nickname || '匿名用户'}</span>
                      <span style={styles.time}>
                        {new Date(q.created_at * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      style={{
                        ...styles.followBtn,
                        ...(q.is_followed ? styles.followed : {})
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        handleFollow(q.id)
                      }}
                    >
                      {q.is_followed ? '已关注' : '+ 关注'}
                    </button>
                  </div>
                  <h3 style={styles.itemTitle}>{q.title}</h3>
                  {q.content && <p style={styles.itemContent}>{q.content.slice(0, 100)}...</p>}
                  <div style={styles.itemStats}>
                    <span style={styles.stat}>👁 {q.view_count || 0}</span>
                    <span style={styles.stat}>💬 {q.answer_count || 0}</span>
                    <span style={styles.stat}>⭐ {q.follow_count || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div style={styles.loadMore}>
              <button style={styles.loadMoreBtn} onClick={handleLoadMore} disabled={loading}>
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '16px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: 0
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e0e0e0',
    borderTopColor: '#007AFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#666',
    fontSize: '14px'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px'
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  errorText: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '14px'
  },
  retryBtn: {
    padding: '10px 24px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyText: {
    color: '#999',
    fontSize: '14px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  itemLink: {
    textDecoration: 'none',
    color: 'inherit'
  },
  item: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0'
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  nickname: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  time: {
    fontSize: '12px',
    color: '#999'
  },
  followBtn: {
    padding: '6px 12px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  followed: {
    backgroundColor: '#f5f5f5',
    color: '#666'
  },
  itemTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px',
    color: '#333',
    lineHeight: '1.5'
  },
  itemContent: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 12px',
    lineHeight: '1.6'
  },
  itemStats: {
    display: 'flex',
    gap: '16px'
  },
  stat: {
    fontSize: '12px',
    color: '#999'
  },
  loadMore: {
    padding: '20px 0',
    textAlign: 'center'
  },
  loadMoreBtn: {
    padding: '12px 32px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666'
  }
}

// 添加全局动画样式
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(styleSheet)

export default Home
