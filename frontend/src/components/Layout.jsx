import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const roleNames = {
  admin: '系统管理员',
  nurse: '护士',
  caregiver: '护理员',
  social_worker: '社工',
  logistics: '后勤',
  family: '家属'
};

const menuItems = [
  { path: '/', label: '护理看板', icon: '📊', roles: ['admin', 'nurse', 'caregiver', 'social_worker', 'logistics'] },
  { path: '/elderly', label: '老人档案', icon: '👴', roles: ['admin', 'nurse', 'caregiver', 'social_worker'] },
  { path: '/care-plans', label: '照护计划', icon: '📋', roles: ['admin', 'nurse', 'caregiver'] },
  { path: '/medication', label: '用药管理', icon: '💊', roles: ['admin', 'nurse', 'caregiver'] },
  { path: '/incidents', label: '异常事件', icon: '⚠️', roles: ['admin', 'nurse', 'caregiver', 'social_worker'] },
  { path: '/fees', label: '费用管理', icon: '💰', roles: ['admin', 'nurse'] },
  { path: '/family', label: '家属视图', icon: '👨‍👩‍👧', roles: ['family', 'admin'] },
];

function Layout({ children, user, onLogout }) {
  const location = useLocation();

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ 
        width: '220px', 
        background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🏥</span>
            养老院管理系统
          </h1>
        </div>
        
        <nav style={{ flex: 1, padding: '15px 0' }}>
          {filteredMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: location.pathname === item.path ? '#4fc3f7' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                background: location.pathname === item.path ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                borderLeft: location.pathname === item.path ? '3px solid #4fc3f7' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '12px' }}>
            {roleNames[user.role]}
          </div>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            退出登录
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
