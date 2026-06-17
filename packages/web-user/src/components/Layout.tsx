import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const loc = useLocation();
  const navItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/orders', icon: <UnorderedListOutlined />, label: '订单' },
    { key: '/profile', icon: <UserOutlined />, label: '我的' },
  ];
  const hideNav = ['/apply/visa', '/apply/idcard', '/vehicle/violation', '/vehicle/inspection', '/order/', '/identity-verify'].some(p => loc.pathname.startsWith(p));
  return (
    <div style={{ minHeight: '100vh', paddingBottom: hideNav ? 0 : undefined }}>
      <Outlet />
      {!hideNav && (
        <div className="bottom-nav">
          {navItems.map(n => (
            <div
              key={n.key}
              className={`nav-item ${loc.pathname === n.key ? 'active' : ''}`}
              onClick={() => navigate(n.key)}
              style={{ fontSize: 11, color: loc.pathname === n.key ? '#00B42A' : '#999' }}
            >
              <div style={{ fontSize: 20, marginBottom: 2 }}>{n.icon}</div>
              {n.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Layout;
