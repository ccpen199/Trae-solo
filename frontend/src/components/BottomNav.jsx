import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/cart', label: '购物车', icon: '🛒' },
    { path: '/orders', label: '订单', icon: '📋' },
    { path: user ? '/profile' : '/login', label: user ? '我的' : '登录', icon: '👤' }
  ];

  const styles = {
    container: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: '#fff',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTop: '1px solid #eee',
      zIndex: 100
    },
    item: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textDecoration: 'none',
      color: '#999',
      fontSize: '12px',
      padding: '8px 0'
    },
    active: {
      color: '#ff4d4f'
    },
    icon: {
      fontSize: '20px',
      marginBottom: '2px'
    }
  };

  return (
    <nav style={styles.container}>
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          style={{ ...styles.item, ...(location.pathname === item.path ? styles.active : {}) }}
        >
          <span style={styles.icon}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
