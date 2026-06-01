import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: '仪表板', icon: '📊' },
    { path: '/clients', label: '客户管理', icon: '👥' },
    { path: '/positions', label: '职位管理', icon: '💼' },
    { path: '/candidates', label: '候选人库', icon: '📋' },
    { path: '/recommendations', label: '推荐管理', icon: '📨' },
    { path: '/commissions', label: '佣金管理', icon: '💰' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ 
        width: '240px', 
        background: '#2c3e50', 
        color: 'white', 
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #34495e', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>猎头职位交付系统</h2>
        </div>
        
        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: location.pathname === item.path ? 'white' : '#bdc3c7',
                textDecoration: 'none',
                background: location.pathname === item.path ? '#3498db' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #34495e' }}>
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#bdc3c7' }}>
            当前用户: {user?.name}
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '30px', background: '#f5f6fa' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
