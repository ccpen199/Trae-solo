import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: '仪表板', icon: '📊', roles: ['admin', 'invigilator', 'student'] },
    { path: '/exams', label: '考试管理', icon: '📝', roles: ['admin', 'invigilator'] },
    { path: '/my-exams', label: '我的考试', icon: '📋', roles: ['student'] },
    { path: '/proctor', label: '监考台', icon: '👁️', roles: ['admin', 'invigilator'] },
    { path: '/users', label: '用户管理', icon: '👥', roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🛡️</span>
          <span style={styles.logoText}>防作弊系统</span>
        </div>

        <nav style={styles.nav}>
          {filteredMenuItems.map(item => (
            <Link key={item.path} to={item.path} style={styles.navLink}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>
              {user?.role === 'admin' ? '管理员' : user?.role === 'invigilator' ? '监考老师' : '考生'}
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>退出</button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh'
  },
  sidebar: {
    width: '260px',
    background: 'white',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 0',
    borderBottom: '1px solid #eee',
    marginBottom: '20px'
  },
  logoIcon: {
    fontSize: '28px'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#555',
    textDecoration: 'none',
    transition: 'all 0.2s',
    fontSize: '14px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '12px',
    marginTop: 'auto'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontWeight: '600',
    color: '#333',
    fontSize: '14px'
  },
  userRole: {
    fontSize: '12px',
    color: '#666'
  },
  logoutBtn: {
    padding: '6px 12px',
    background: '#fee',
    color: '#c33',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  main: {
    flex: 1,
    background: '#f5f7fa',
    padding: '30px',
    overflow: 'auto'
  }
};

export default Layout;
