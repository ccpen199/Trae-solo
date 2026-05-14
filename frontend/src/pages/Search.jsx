import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'

const Search = () => {
  const [keyword, setKeyword] = useState('')
  const [hotSearches, setHotSearches] = useState([])
  const [history, setHistory] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchHotSearches()
    if (user) {
      fetchHistory()
    }
  }, [user])

  const fetchHotSearches = async () => {
    try {
      const res = await client.get('/search/hot')
      if (res.data.success) {
        setHotSearches(res.data.data)
      }
    } catch (err) {
      console.error('获取热搜失败', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await client.get('/search/history')
      if (res.data.success) {
        setHistory(res.data.data)
      }
    } catch (err) {
      console.error('获取搜索历史失败', err)
    }
  }

  const clearHistory = async () => {
    try {
      await client.delete('/search/history')
      setHistory([])
      showToast('搜索历史已清空', 'success')
    } catch (err) {
      showToast('清空失败', 'error')
    }
  }

  const handleSearch = async (searchKeyword = keyword) => {
    if (!searchKeyword.trim()) return
    setKeyword(searchKeyword)
    setLoading(true)
    setShowResults(true)
    try {
      const res = await client.get(`/search?keyword=${encodeURIComponent(searchKeyword)}`)
      if (res.data.success) {
        setResults(res.data.data.list)
      }
    } catch (err) {
      showToast('搜索失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleHotClick = (word) => {
    handleSearch(word)
  }

  const handleBack = () => {
    if (showResults) {
      setShowResults(false)
      setKeyword('')
      setResults([])
    } else {
      navigate('/')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={handleBack}>←</button>
        <div style={styles.searchBox}>
          <input
            style={styles.searchInput}
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="搜索问题、话题或用户"
            autoFocus
          />
          {keyword && (
            <button style={styles.clearBtn} onClick={() => setKeyword('')}>×</button>
          )}
        </div>
        <button style={styles.searchBtn} onClick={() => handleSearch()}>搜索</button>
      </div>

      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}

      {showResults ? (
        <div style={styles.results}>
          {results.length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.emptyIcon}>🔍</div>
              <p style={styles.emptyText}>未找到相关内容</p>
            </div>
          ) : (
            <div style={styles.list}>
              {results.map(q => (
                <Link key={q.id} to={`/question/${q.id}`} style={styles.itemLink}>
                  <div style={styles.item}>
                    <h3 style={styles.itemTitle}>{q.title}</h3>
                    {q.content && <p style={styles.itemContent}>{q.content.slice(0, 80)}...</p>}
                    <div style={styles.itemStats}>
                      <span style={styles.stat}>{q.nickname || '匿名'}</span>
                      <span style={styles.stat}>👁 {q.view_count || 0}</span>
                      <span style={styles.stat}>💬 {q.answer_count || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {history.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>搜索历史</h3>
                <button style={styles.clearHistoryBtn} onClick={clearHistory}>清空</button>
              </div>
              <div style={styles.tagList}>
                {history.map((word, index) => (
                  <button key={index} style={styles.tag} onClick={() => handleSearch(word)}>
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hotSearches.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🔥 热门搜索</h3>
              <div style={styles.hotList}>
                {hotSearches.map((item, index) => (
                  <button
                    key={index}
                    style={styles.hotItem}
                    onClick={() => handleHotClick(item.keyword)}
                  >
                    <span style={{
                      ...styles.hotIndex,
                      ...(index < 3 ? styles.hotIndexTop : {})
                    }}>
                      {index + 1}
                    </span>
                    <span style={styles.hotKeyword}>{item.keyword}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>💡 推荐搜索</h3>
            <div style={styles.tagList}>
              {['前端开发', '人工智能', 'Python', '考研', '职场', '健身'].map(word => (
                <button key={word} style={styles.tag} onClick={() => handleSearch(word)}>
                  {word}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '16px',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  backBtn: {
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '20px',
    cursor: 'pointer'
  },
  searchBox: {
    flex: 1,
    position: 'relative'
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 16px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    borderRadius: '20px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  clearBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '18px',
    color: '#999',
    cursor: 'pointer',
    padding: '0 4px'
  },
  searchBtn: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 100
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e0e0e0',
    borderTopColor: '#007AFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  section: {
    marginBottom: '24px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  clearHistoryBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#999',
    fontSize: '12px',
    cursor: 'pointer'
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    borderRadius: '16px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#333'
  },
  hotList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  hotItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    border: 'none',
    backgroundColor: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box'
  },
  hotIndex: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#999'
  },
  hotIndexTop: {
    backgroundColor: '#FF6B00',
    color: 'white'
  },
  hotKeyword: {
    fontSize: '14px',
    color: '#333'
  },
  results: {
    marginTop: '16px'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px'
  },
  emptyIcon: {
    fontSize: '48px',
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
    borderRadius: '12px'
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 8px',
    color: '#333'
  },
  itemContent: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 10px'
  },
  itemStats: {
    display: 'flex',
    gap: '16px'
  },
  stat: {
    fontSize: '12px',
    color: '#999'
  }
}

export default Search
