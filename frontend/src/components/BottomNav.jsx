import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Video, PlusSquare, MessageCircle, User } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/moments', icon: Video, label: '动态' },
    { path: '/create-live', icon: PlusSquare, label: '开播', special: true },
    { path: '/messages', icon: MessageCircle, label: '消息' },
    { path: '/profile', icon: User, label: '我的' }
  ];

  const isHidden = currentPath.startsWith('/live-room/') || 
                   currentPath === '/login' || 
                   currentPath === '/register';

  if (isHidden) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0',
      paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      zIndex: 100
    }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: currentPath === item.path ? '#ff4757' : '#999',
            fontSize: '11px',
            position: 'relative',
            flex: 1
          }}
        >
          {item.special ? (
            <div style={{
              width: '48px',
              height: '32px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <item.icon size={20} color="white" />
            </div>
          ) : (
            <>
              <item.icon size={22} style={{ marginBottom: '4px' }} />
              <span>{item.label}</span>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}

export default BottomNav;
