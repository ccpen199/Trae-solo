import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { path: '/', label: '📊 仪表盘', roles: ['admin', 'operator', 'developer', 'owner', 'security'] },
    { path: '/applications', label: '📱 应用管理', roles: ['admin', 'owner', 'developer'] },
    { path: '/change-orders', label: '📝 变更审批', roles: ['admin', 'operator', 'owner', 'security'] },
    { path: '/execution', label: '⚡ 执行任务', roles: ['admin', 'operator'] },
    { path: '/audit', label: '🔍 审计日志', roles: ['admin', 'security'] },
    { path: '/reports', label: '📈 报表统计', roles: ['admin', 'security'] }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-header">
          ⚙️ 审批平台
        </div>
        <ul className="sidebar-menu">
          {visibleMenuItems.map(item => (
            <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        <div className="header">
          <h2>低代码审批表单平台</h2>
          <div className="user-info">
            <span>👤 {user.name} ({user.role})</span>
            <button onClick={handleLogout}>退出</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Layout;
