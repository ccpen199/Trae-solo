import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/coupons', label: '优惠券管理', icon: '🎫' },
    { path: '/admin/shares', label: '分享管理', icon: '📤' },
    { path: '/admin/orders', label: '订单管理', icon: '📦' },
    { path: '/admin/shops', label: '店铺管理', icon: '🏪' },
    { path: '/admin/activities', label: '活动管理', icon: '🎯' },
    { path: '/admin/users', label: '用户管理', icon: '👥' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="admin-sidebar">
        <div style={{ padding: '20px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: 0 }}>管理后台</h3>
          <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
            优惠券平台
          </p>
        </div>
        <ul className="admin-menu">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              <span style={{ marginRight: '8px' }}>{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>
        <div style={{ position: 'absolute', bottom: '60px', width: '100%', padding: '0 20px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </div>
      </aside>
      <main className="admin-content" style={{ flex: 1 }}>
        <div style={{ marginBottom: '24px' }}>
          <h1>{menuItems.find(m => m.path === location.pathname)?.label || 'Dashboard'}</h1>
        </div>
        {location.pathname === '/admin' ? (
          <AdminDashboardInline />
        ) : location.pathname === '/admin/coupons' ? (
          <AdminCouponsInline />
        ) : location.pathname === '/admin/shares' ? (
          <AdminSharesInline />
        ) : location.pathname === '/admin/orders' ? (
          <AdminOrdersInline />
        ) : location.pathname === '/admin/shops' ? (
          <AdminShopsInline />
        ) : location.pathname === '/admin/activities' ? (
          <AdminActivitiesInline />
        ) : location.pathname === '/admin/users' ? (
          <AdminUsersInline />
        ) : null}
      </main>
    </div>
  );
}

function AdminDashboardInline() {
  return <div>Dashboard Content</div>;
}

function AdminCouponsInline() {
  return <div>Coupons Content</div>;
}

function AdminSharesInline() {
  return <div>Shares Content</div>;
}

function AdminOrdersInline() {
  return <div>Orders Content</div>;
}

function AdminShopsInline() {
  return <div>Shops Content</div>;
}

function AdminActivitiesInline() {
  return <div>Activities Content</div>;
}

function AdminUsersInline() {
  return <div>Users Content</div>;
}

export default AdminLayout;
