import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function AdminLayout() {
  const menuItems = [
    { path: '/admin', icon: '📊', label: '数据看板', end: true },
    { path: '/admin/task-review', icon: '✅', label: '任务审核' },
    { path: '/admin/employers', icon: '🏢', label: '雇主管理' },
    { path: '/admin/verifications', icon: '🆔', label: '实名认证' },
    { path: '/admin/appeals', icon: '⚖️', label: '申诉处理' },
    { path: '/admin/stats', icon: '📈', label: '统计分析' },
    { path: '/admin/tasks', icon: '📋', label: '任务管理' },
    { path: '/admin/users', icon: '👥', label: '用户管理' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <div className="sidebar">
        <div style={{ 
          padding: '20px 16px', 
          fontSize: '18px', 
          fontWeight: 700,
          color: '#1e293b',
          borderBottom: '1px solid #f1f5f9'
        }}>
          后台管理
        </div>
        
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
      
      <div style={{ flex: 1, padding: '32px', background: '#f8fafc' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
