import { useLocation, useNavigate } from 'react-router-dom';

function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/home', icon: '🏠', label: '首页' },
    { path: '/recommend', icon: '💝', label: '推荐' },
    { path: '/search', icon: '🔍', label: '搜索' },
    { path: '/cart', icon: '🛒', label: '购物车' },
    { path: '/profile', icon: '👤', label: '我的' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#fff',
      display: 'flex',
      borderTop: '1px solid #eee',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {tabs.map(tab => (
        <div
          key={tab.path}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 0',
            cursor: 'pointer',
            color: location.pathname === tab.path ? '#ff6b35' : '#666'
          }}
          onClick={() => navigate(tab.path)}
        >
          <span style={{ fontSize: '22px' }}>{tab.icon}</span>
          <span style={{ fontSize: '12px', marginTop: '2px' }}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

export default TabBar;
