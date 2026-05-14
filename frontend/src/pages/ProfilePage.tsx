
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>←</button>
        <span style={styles.title}>个人中心</span>
        <div></div>
      </div>

      <div style={styles.content}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>👤</div>
          <div>
            <div style={styles.phone}>{user?.phone}</div>
            <div style={styles.userId}>用户ID: {user?.userId}</div>
          </div>
        </div>

        <div style={styles.menu}>
          <div style={styles.menuItem}>我的订单</div>
          <div style={styles.menuItem}>我的钱包</div>
          <div style={styles.menuItem}>优惠券</div>
          <div style={styles.menuItem}>设置</div>
        </div>

        <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
          退出登录
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  backBtn: {
    background: 'none',
    fontSize: '24px',
    padding: '0'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold' as const
  },
  content: {
    padding: '20px'
  },
  userInfo: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#ff6600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    color: '#fff'
  },
  phone: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#333'
  },
  userId: {
    fontSize: '14px',
    color: '#999',
    marginTop: '4px'
  },
  menu: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  menuItem: {
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
    fontSize: '16px',
    color: '#333'
  },
  logoutBtn: {
    width: '100%',
    padding: '16px',
    background: '#fff',
    color: '#ff4444',
    fontSize: '16px',
    border: 'none',
    borderRadius: '12px',
    marginTop: '24px'
  }
};
