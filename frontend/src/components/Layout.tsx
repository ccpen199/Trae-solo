import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/app.store';

const navItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/services', label: '服务管理', icon: '🔧' },
  { path: '/alerts', label: '告警中心', icon: '🔔' },
  { path: '/audit', label: '审计日志', icon: '📋' },
  { path: '/trace', label: '链路追踪', icon: '🔍' },
];

export function Layout() {
  const location = useLocation();
  const { alerts } = useAppStore();
  const unacknowledgedAlerts = alerts.filter((a) => !a.is_acknowledged).length;

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.logo}>
          <h1 style={styles.logoTitle}>API 网关</h1>
          <span style={styles.logoSubtitle}>管理平台</span>
        </div>

        <div style={styles.navLinks}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.path === '/alerts' && unacknowledgedAlerts > 0 && (
                  <span style={styles.badge}>{unacknowledgedAlerts}</span>
                )}
              </Link>
            );
          })}
        </div>

        <div style={styles.footer}>
          <p style={styles.version}>v1.0.0</p>
          <p style={styles.portInfo}>Backend: 9165 | Frontend: 9166</p>
        </div>
      </nav>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
  },
  logo: {
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '1px solid #16213e',
  },
  logoTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#e94560',
  },
  logoSubtitle: {
    fontSize: '12px',
    color: '#6b7280',
    display: 'block',
    marginTop: '4px',
  },
  navLinks: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    color: '#a0aec0',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s',
    position: 'relative',
  },
  navLinkActive: {
    backgroundColor: '#16213e',
    color: '#fff',
  },
  navIcon: {
    fontSize: '18px',
  },
  badge: {
    position: 'absolute',
    right: '12px',
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center',
  },
  main: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: '24px',
    overflow: 'auto',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid #16213e',
  },
  version: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
  },
  portInfo: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#4b5563',
  },
};
