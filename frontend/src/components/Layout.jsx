import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/sales-control', label: '销控表', icon: '📊' },
    { path: '/properties', label: '房源库', icon: '🏠' },
    { path: '/subscriptions', label: '认购管理', icon: '📝' },
  ];

  if (user.role === 'manager' || user.role === 'admin') {
    menuItems.push({ path: '/approvals', label: '审批中心', icon: '✅' });
    menuItems.push({ path: '/finance', label: '财务跟进', icon: '💰' });
  } else if (user.role === 'finance') {
    menuItems.push({ path: '/finance', label: '财务收款', icon: '💰' });
  }

  menuItems.push({ path: '/statistics', label: '销售统计', icon: '📈' });

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="logo">🏢 房源销控系统</div>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                  {item.icon} {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <div className="header">
          <h1>欢迎使用房源销控系统</h1>
          <div className="user-info">
            <span>👤 {user.name} ({user.role})</span>
            <button className="btn btn-default btn-sm" onClick={handleLogout}>
              退出
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export default Layout;
