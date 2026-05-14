import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '80px 20px',
        background: '#fff',
        minHeight: '80vh'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ marginBottom: '10px', color: '#333' }}>请先登录</h2>
        <p style={{ color: '#999', marginBottom: '30px' }}>登录后可以查看个人中心</p>
        <button 
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 40px',
            background: '#ff4d4f',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          立即登录
        </button>
      </div>
    );
  }

  const styles = {
    header: {
      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
      padding: '30px 20px',
      color: '#fff'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '30px'
    },
    name: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    member: {
      fontSize: '12px',
      opacity: 0.9
    },
    menu: {
      background: '#fff',
      marginTop: '10px'
    },
    menuItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px',
      borderBottom: '1px solid #f5f5f5'
    },
    logoutBtn: {
      margin: '20px',
      padding: '15px',
      background: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      color: '#ff4d4f',
      width: 'calc(100% - 40px)'
    }
  };

  const menuItems = [
    { icon: '📦', label: '我的订单' },
    { icon: '❤️', label: '我的收藏' },
    { icon: '🎫', label: '优惠券' },
    { icon: '📍', label: '收货地址' },
    { icon: '⚙️', label: '设置' }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>👤</div>
          <div>
            <div style={styles.name}>{user?.nickname || '用户'}</div>
            <div style={styles.member}>🐔 普通会员</div>
          </div>
        </div>
      </div>
      <div style={styles.menu}>
        {menuItems.map((item, i) => (
          <div key={i} style={styles.menuItem}>
            <span>{item.icon} {item.label}</span>
            <span>›</span>
          </div>
        ))}
      </div>
      <button onClick={handleLogout} style={styles.logoutBtn}>退出登录</button>
    </div>
  );
};

export default Profile;
