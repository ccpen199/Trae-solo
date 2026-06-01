import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Circles = () => {
  const [circles, setCircles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        const res = await api.get('/circles')
        if (res.data.success) {
          setCircles(res.data.data || [])
        }
      } catch (err) {
        console.error('获取圈子失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCircles()
  }, [])

  if (loading) {
    return <div style={styles.loading}>加载中...</div>
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>圈子</h1>
      </header>

      {circles.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>👥</div>
          <p style={styles.emptyText}>暂无圈子</p>
        </div>
      ) : (
        <div style={styles.circleList}>
          {circles.map((circle) => (
            <div key={circle.id} style={styles.circleCard}>
              <div style={styles.circleIcon}>
                {circle.icon || '🌐'}
              </div>
              <div style={styles.circleInfo}>
                <h3 style={styles.circleName}>{circle.name}</h3>
                {circle.description && (
                  <p style={styles.circleDesc}>{circle.description}</p>
                )}
                <div style={styles.circleMeta}>
                  <span style={styles.memberCount}>
                    👤 {circle.member_count || 0} 成员
                  </span>
                </div>
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
  circleList: {
    padding: '12px 0'
  },
  circleCard: {
    background: '#fff',
    padding: '16px 20px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  circleIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px'
  },
  circleInfo: {
    flex: 1
  },
  circleName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  circleDesc: {
    fontSize: '13px',
    color: '#999',
    marginBottom: '8px'
  },
  circleMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  memberCount: {
    fontSize: '12px',
    color: '#666'
  }
}

export default Circles