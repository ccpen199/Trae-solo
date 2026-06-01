import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Profile = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile')
        if (res.data.success) {
          setProfile(res.data.data)
        }
      } catch (err) {
        console.error('获取个人信息失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return <div style={styles.loading}>加载中...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.avatar}>
          {(profile?.nickname || user?.nickname || 'U').charAt(0).toUpperCase()}
        </div>
        <h2 style={styles.username}>{profile?.nickname || user?.nickname || '用户'}</h2>
        {profile?.bio && <p style={styles.bio}>{profile.bio}</p>}
      </div>

      <div style={styles.menuList}>
        <div style={styles.menuItem} onClick={() => navigate('/merchant')}>
          <span style={styles.menuIcon}>🏪</span>
          <span style={styles.menuText}>商户收款</span>
          <span style={styles.menuArrow}>›</span>
        </div>

        <div style={styles.menuItem}>
          <span style={styles.menuIcon}>📝</span>
          <span style={styles.menuText}>编辑资料</span>
          <span style={styles.menuArrow}>›</span>
        </div>

        <div style={styles.menuItem}>
          <span style={styles.menuIcon}>🔔</span>
          <span style={styles.menuText}>消息通知</span>
          <span style={styles.menuArrow}>›</span>
        </div>

        <div style={styles.menuItem}>
          <span style={styles.menuIcon}>⚙️</span>
          <span style={styles.menuText}>设置</span>
          <span style={styles.menuArrow}>›</span>
        </div>

        <div style={styles.menuItem}>
          <span style={styles.menuIcon}>❓</span>
          <span style={styles.menuText}>帮助与反馈</span>
          <span style={styles.menuArrow}>›</span>
        </div>
      </div>

      <button onClick={handleLogout} style={styles.logoutButton}>
        退出登录
      </button>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  },
  header: {
    padding: '40px 20px 32px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    textAlign: 'center'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '40px',
    background: '#fff',
    color: '#4CAF50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 auto 16px'
  },
  username: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px'
  },
  bio: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)'
  },
  menuList: {
    background: '#fff',
    marginTop: '-12px',
    borderRadius: '12px 12px 0 0'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer'
  },
  menuIcon: {
    fontSize: '20px',
    marginRight: '16px'
  },
  menuText: {
    flex: 1,
    fontSize: '15px',
    color: '#333'
  },
  menuArrow: {
    fontSize: '16px',
    color: '#ccc'
  },
  logoutButton: {
    width: 'calc(100% - 40px)',
    margin: '24px 20px',
    padding: '14px',
    background: '#FFEBEE',
    color: '#E53935',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  }
}

export default Profile