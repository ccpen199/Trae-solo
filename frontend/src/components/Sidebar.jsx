import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar({ navItems, currentPath, user }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🍸 酒吧管理系统</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '14px', color: 'var(--text)' }}>{user.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {user.role === 'manager' ? '店长' : 
           user.role === 'bartender' ? '调酒师' :
           user.role === 'warehouse' ? '仓管' :
           user.role === 'finance' ? '财务' : '管理员'}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
