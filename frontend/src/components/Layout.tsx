import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels: Record<string, string> = {
    business_owner: '业务负责人',
    model_operator: '模型运营',
    reviewer: '审核人员',
    frontline_user: '一线使用者',
  };

  const navItems = [
    { path: '/', label: '工作台', icon: '📊' },
    { path: '/agents', label: 'Agent 档案', icon: '🤖' },
    { path: '/customers', label: '客户画像', icon: '👥' },
    { path: '/generate', label: '生成邮件', icon: '✉️' },
    { path: '/emails', label: '邮件列表', icon: '📧' },
    { path: '/templates', label: '邮件模板', icon: '📋' },
    { path: '/send-records', label: '发送记录', icon: '📤' },
    { path: '/audit', label: '审计日志', icon: '📜' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">📧 AI 邮件助手</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="header">
          <span>欢迎使用 AI 销售邮件生成系统</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>
              {user?.name} ({roleLabels[user?.roleName || ''] || user?.roleName})
            </span>
            <button className="btn btn-default btn-sm" onClick={handleLogout}>
              退出
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
