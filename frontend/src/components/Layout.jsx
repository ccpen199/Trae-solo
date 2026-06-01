import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleNames = {
  admin: '系统管理员',
  psychologist: '心理老师',
  teacher: '班主任',
  student: '学生'
};

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: '首页概览', icon: '📊', roles: ['admin', 'psychologist', 'teacher', 'student'] },
    { path: '/plans', label: '测评计划', icon: '📋', roles: ['admin', 'psychologist', 'teacher', 'student'] },
    { path: '/scales', label: '量表管理', icon: '📝', roles: ['admin', 'psychologist'] },
    { path: '/results', label: '结果分析', icon: '📈', roles: ['admin', 'psychologist', 'teacher', 'student'] },
    { path: '/interventions', label: '干预跟进', icon: '🤝', roles: ['admin', 'psychologist', 'teacher'] },
    { path: '/todos', label: '待办事项', icon: '✅', roles: ['admin', 'psychologist', 'teacher'] },
    { path: '/users', label: '用户管理', icon: '👥', roles: ['admin'] }
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>心理测评系统</h1>
          <p>School Psychology Assessment</p>
        </div>
        <nav className="sidebar-nav">
          {visibleMenuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="name">{user.name}</div>
            <div className="role">{roleNames[user.role]}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
