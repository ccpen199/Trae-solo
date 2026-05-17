import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Mic, Globe, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: '翻译' },
  { path: '/speaking', icon: Mic, label: '练听说' },
  { path: '/world', icon: Globe, label: '看世界' },
  { path: '/profile', icon: User, label: '我的' }
];

const TabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPaths = ['/login', '/register', '/camera', '/favorites'];
  if (hiddenPaths.some(path => location.pathname.includes(path))) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 24px 0',
      zIndex: 100
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px 16px'
            }}
          >
            <tab.icon
              size={24}
              color={isActive ? '#007AFF' : '#999'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span style={{
              fontSize: 11,
              color: isActive ? '#007AFF' : '#999',
              fontWeight: isActive ? 500 : 400
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
