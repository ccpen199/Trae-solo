import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  const tabs = [
    { path: '/', icon: '📝', label: '笔记' },
    { path: '/search', icon: '🔍', label: '搜索' },
    { path: '/vip', icon: '👑', label: '会员' },
    { path: '/my', icon: '👤', label: '我的' }
  ];

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      maxWidth: '500px',
      margin: '0 auto',
      background: 'white',
      boxShadow: '0 0 20px rgba(0,0,0,0.05)'
    }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
      
      <div style={{
        display: 'flex',
        borderTop: '1px solid #eee',
        padding: '8px 0',
        background: 'white'
      }}>
        {tabs.map(tab => (
          <div
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              cursor: 'pointer',
              color: location.pathname === tab.path ? '#1890ff' : '#666'
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>{tab.icon}</span>
            <span style={{ fontSize: '12px' }}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
