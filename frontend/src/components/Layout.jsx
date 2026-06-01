import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getRoleName = (role) => {
    const roleMap = {
      supervisor: '督导',
      consultant: '咨询师',
      parent: '家长',
      operator: '运营管理员',
    };
    return roleMap[role] || role;
  };

  const menuItems = [
    { path: '/', icon: '🏠', label: '仪表板', roles: ['supervisor', 'consultant', 'parent', 'operator'] },
    { path: '/family-profiles', icon: '👨‍👩‍👧', label: '家庭档案', roles: ['supervisor', 'consultant', 'operator'] },
    { path: '/assessments', icon: '📋', label: '初评管理', roles: ['supervisor', 'consultant', 'parent', 'operator'] },
    { path: '/consultation-plans', icon: '📝', label: '咨询方案', roles: ['supervisor', 'consultant', 'parent', 'operator'] },
    { path: '/follow-up-records', icon: '📅', label: '跟进记录', roles: ['supervisor', 'consultant', 'parent', 'operator'] },
    { path: '/reports', icon: '📊', label: '运营报表', roles: ['supervisor', 'operator'] },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          家庭教育咨询管理系统
        </div>
        <ul className="sidebar-menu">
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <span style={{ marginRight: '8px' }}>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            欢迎使用家庭教育咨询管理系统
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{user?.name || '用户'}</div>
              <div className="user-role">{getRoleName(user?.role)}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
