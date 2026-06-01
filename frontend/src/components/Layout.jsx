import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { alertAPI } from '../api.js';

function Layout({ user, onLogout }) {
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    loadAlertCount();
  }, []);

  const loadAlertCount = async () => {
    try {
      const response = await alertAPI.list({ status: 'pending' });
      setAlertCount(response.data.length);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const roleLabels = {
    platform_engineer: '平台工程师',
    ops: '运维',
    developer: '开发者',
    app_owner: '应用负责人',
    security_admin: '安全管理员'
  };

  const navItems = [
    { path: '/dashboard', label: '看板' },
    { path: '/tasks', label: '执行任务' },
    { path: '/applications', label: '应用管理' },
    { path: '/alerts', label: `告警中心${alertCount > 0 ? ` (${alertCount})` : ''}` },
    { path: '/config', label: '系统配置' }
  ];

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>🔄 数据库迁移工具</h1>
          <div className="user-info">
            <span>{user?.name}</span>
            <span className={`role-badge role-${user?.role}`}>{roleLabels[user?.role]}</span>
            <button className="btn btn-sm btn-default" onClick={onLogout}>退出</button>
          </div>
        </div>
      </header>
      <nav className="nav">
        <div className="nav-content">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
