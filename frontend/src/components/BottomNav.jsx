import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusCircle, MessageCircle, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/nearby', icon: Users, label: '附近' },
    { path: '/capture', icon: PlusCircle, label: '拍摄', isSpecial: true },
    { path: '/following', icon: MessageCircle, label: '关注' },
    { path: '/profile', icon: User, label: '我的' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderTop: '1px solid #333',
      zIndex: 1000
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: isActive ? '#fe2c55' : '#fff',
              flex: 1,
              height: '100%'
            }}
          >
            {item.isSpecial ? (
              <div style={{
                width: '48px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #fe2c55, #25f4ee)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} color="#fff" />
              </div>
            ) : (
              <Icon size={24} />
            )}
            <span style={{ fontSize: '10px', marginTop: '4px' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
