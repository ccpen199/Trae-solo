import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const workerNav: NavItem[] = [
  { label: '首页', path: '/home', icon: '🏠' },
  { label: '岗位列表', path: '/jobs', icon: '📋' },
  { label: '我的申请', path: '/my-applications', icon: '📝' },
  { label: '消息中心', path: '/chat', icon: '💬' },
  { label: '结算中心', path: '/settlements', icon: '💰' },
  { label: '风险地图', path: '/risk-map', icon: '🗺️' },
  { label: '高校服务', path: '/university', icon: '🎓' },
];

const employerNav: NavItem[] = [
  { label: '首页', path: '/home', icon: '🏠' },
  { label: '发布岗位', path: '/jobs/create', icon: '➕' },
  { label: '岗位管理', path: '/jobs', icon: '📋' },
  { label: '消息中心', path: '/chat', icon: '💬' },
  { label: '结算管理', path: '/settlements', icon: '💰' },
  { label: '风险地图', path: '/risk-map', icon: '🗺️' },
];

const adminNav: NavItem[] = [
  { label: '仪表盘', path: '/admin/dashboard', icon: '📊' },
  { label: '用户管理', path: '/admin/users', icon: '👥' },
  { label: '岗位审核', path: '/jobs', icon: '✅' },
  { label: '舆情监测', path: '/admin/opinion-alerts', icon: '🔔' },
  { label: '审计日志', path: '/admin/audit-logs', icon: '📜' },
  { label: '风险管理', path: '/risk-map', icon: '🛡️' },
  { label: '高校管理', path: '/university', icon: '🎓' },
];

const platformNav: NavItem[] = [
  { label: '运营仪表盘', path: '/admin/dashboard', icon: '📊' },
  { label: '岗位审核', path: '/jobs', icon: '✅' },
  { label: '舆情监测', path: '/admin/opinion-alerts', icon: '🔔' },
  { label: '风险管理', path: '/risk-map', icon: '🛡️' },
  { label: '结算总览', path: '/settlements', icon: '💰' },
  { label: '高校协同', path: '/university', icon: '🎓' },
];

const opsNav: NavItem[] = [
  { label: '运营仪表盘', path: '/admin/dashboard', icon: '📊' },
  { label: '岗位管理', path: '/jobs', icon: '📋' },
  { label: '用户管理', path: '/admin/users', icon: '👥' },
  { label: '舆情监测', path: '/admin/opinion-alerts', icon: '🔔' },
  { label: '审计日志', path: '/admin/audit-logs', icon: '📜' },
  { label: '风险地图', path: '/risk-map', icon: '🗺️' },
];

const universityNav: NavItem[] = [
  { label: '首页', path: '/home', icon: '🏠' },
  { label: '岗位推送', path: '/jobs', icon: '📋' },
  { label: '实习证明', path: '/university', icon: '🎓' },
  { label: '消息中心', path: '/chat', icon: '💬' },
  { label: '风险地图', path: '/risk-map', icon: '🗺️' },
];

const roleNavMap: Record<string, NavItem[]> = {
  worker: workerNav,
  employer: employerNav,
  admin: adminNav,
  platform: platformNav,
  ops: opsNav,
  university: universityNav,
};

const roleLabel: Record<string, string> = {
  worker: '兼职者',
  employer: '雇主',
  admin: '超级管理员',
  platform: '平台运营',
  ops: '运营管理',
  university: '高校就业办',
};

const roleBadgeColor: Record<string, string> = {
  worker: 'bg-green-500/20 text-green-400',
  employer: 'bg-blue-500/20 text-blue-400',
  admin: 'bg-red-500/20 text-red-400',
  platform: 'bg-purple-500/20 text-purple-400',
  ops: 'bg-orange-500/20 text-orange-400',
  university: 'bg-cyan-500/20 text-cyan-400',
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = roleNavMap[user?.role || 'worker'] || workerNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-60'
        } bg-[#0f172a] flex flex-col transition-all duration-200 flex-shrink-0`}
      >
        <div className="flex items-center h-16 px-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
              兼
            </div>
            {!collapsed && <span className="text-white font-bold text-lg tracking-wide">兼职通</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-white/40 hover:text-white/80 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-3 my-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`
              }
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400 font-semibold text-sm flex-shrink-0">
              {user?.nickname?.[0] || user?.username?.[0] || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-medium truncate">
                  {user?.nickname || user?.username || user?.phone}
                </p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${roleBadgeColor[user?.role || 'worker']}`}>
                  {roleLabel[user?.role || 'worker']}
                </span>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="text-white/30 hover:text-white/70 transition-colors"
                title="退出登录"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
