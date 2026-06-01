import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const tabs = [
    { path: '/', label: '习惯', icon: '📋' },
    { path: '/explore', label: '发现', icon: '🔍' },
    { path: '/circles', label: '圈子', icon: '👥' },
    { path: '/profile', label: '我的', icon: '👤' }
  ]

  const handleTabClick = (tab) => {
    if (!isAuthenticated && (tab.path === '/profile' || tab.path === '/')) {
      setShowLoginModal(true)
      return
    }
    navigate(tab.path)
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <Outlet />
      </main>

      <nav style={styles.nav}>
        {tabs.map(tab => (
          <button
            key={tab.path}
            onClick={() => handleTabClick(tab)}
            style={{
              ...styles.navItem,
              ...(location.pathname === tab.path ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>{tab.icon}</span>
            <span style={styles.navLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {showLoginModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>需要登录</h3>
            <p style={styles.modalText}>此功能需要登录后才能使用</p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowLoginModal(false)} style={styles.modalCancel}>取消</button>
              <button onClick={() => navigate('/login')} style={styles.modalConfirm}>去登录</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '480px',
    margin: '0 auto',
    background: '#fff'
  },
  main: {
    flex: 1,
    paddingBottom: '70px',
    minHeight: 'calc(100vh - 70px)'
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    background: '#fff',
    borderTop: '1px solid #eee',
    maxWidth: '480px',
    margin: '0 auto',
    height: '60px',
    zIndex: 100
  },
  navItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#999'
  },
  navItemActive: {
    color: '#4CAF50'
  },
  navIcon: {
    fontSize: '20px',
    marginBottom: '4px'
  },
  navLabel: {
    fontSize: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '80%',
    maxWidth: '320px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    textAlign: 'center'
  },
  modalText: {
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center'
  },
  modalActions: {
    display: 'flex',
    gap: '12px'
  },
  modalCancel: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer'
  },
  modalConfirm: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: '#4CAF50',
    color: '#fff',
    cursor: 'pointer'
  }
}

export default Layout