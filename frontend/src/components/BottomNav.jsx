import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useStore(state => !!state.token);

  const tabs = [
    { id: 'home', path: '/', icon: '🏠', label: '秒杀' },
    { id: 'logistics', path: '/logistics', icon: '📦', label: '物流' },
    { id: 'reminders', path: '/reminders', icon: '⏰', label: '提醒' },
    { id: 'profile', path: '/profile', icon: '👤', label: '我的' }
  ];

  const handleNavigate = (path, id) => {
    if ((id === 'logistics' || id === 'reminders' || id === 'profile') && !isLoggedIn) {
      navigate('/login', { state: { from: { pathname: path } } });
    } else {
      navigate(path);
    }
  };

  return (
    <div style={styles.container}>
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <div
            key={tab.id}
            style={{
              ...styles.tab,
              color: isActive ? '#ff4757' : '#999'
            }}
            onClick={() => handleNavigate(tab.path, tab.id)}
          >
            <div style={styles.icon}>{tab.icon}</div>
            <div style={styles.label}>{tab.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    backgroundColor: '#fff',
    borderTop: '1px solid #eee',
    paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: 100
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 0',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  icon: {
    fontSize: '20px',
    marginBottom: '4px'
  },
  label: {
    fontSize: '12px'
  }
};

export default BottomNav;
