import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Explore = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/circles/explore')
        if (res.data.success) {
          setPosts(res.data.data || [])
        }
      } catch (err) {
        console.error('获取动态失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  if (loading) {
    return <div style={styles.loading}>加载中...</div>
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>发现</h1>
      </header>

      {posts.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔍</div>
          <p style={styles.emptyText}>暂无动态</p>
        </div>
      ) : (
        <div style={styles.postList}>
          {posts.map((post) => (
            <div key={post.id} style={styles.postCard}>
              <div style={styles.postHeader}>
                <div style={styles.avatar}>
                  {(post.user_nickname || '用户').charAt(0).toUpperCase()}
                </div>
                <div style={styles.postUser}>
                  <span style={styles.username}>{post.user_nickname || '用户'}</span>
                  {post.circle_name && (
                    <span style={styles.circleTag}>#{post.circle_name}</span>
                  )}
                </div>
              </div>
              <p style={styles.postContent}>{post.content}</p>
              {post.images && (
                <div style={styles.postImages}>
                  {JSON.parse(post.images).map((img, i) => (
                    <div key={i} style={styles.postImage}>📷</div>
                  ))}
                </div>
              )}
              <div style={styles.postFooter}>
                <span style={styles.action}>❤️ {post.likes_count || 0}</span>
                <span style={styles.action}>💬 {post.comments_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    padding: '20px 20px 16px',
    background: '#fff'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  },
  empty: {
    padding: '80px 24px',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#999'
  },
  postList: {
    padding: '12px 0'
  },
  postCard: {
    background: '#fff',
    padding: '16px 20px',
    marginBottom: '8px'
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: '#4CAF50',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    marginRight: '12px'
  },
  postUser: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  username: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333'
  },
  circleTag: {
    fontSize: '12px',
    color: '#4CAF50',
    background: '#E8F5E9',
    padding: '2px 8px',
    borderRadius: '10px',
    alignSelf: 'flex-start'
  },
  postContent: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '12px'
  },
  postImages: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  postImage: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  postFooter: {
    display: 'flex',
    gap: '24px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0'
  },
  action: {
    fontSize: '13px',
    color: '#999',
    cursor: 'pointer'
  }
}

export default Explore