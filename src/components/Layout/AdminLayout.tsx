import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  ClipboardCheck,
  Activity,
  ShieldAlert,
  Flame,
  Bell,
  LogOut,
  Landmark,
  Shield,
  Database,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { AdminRole } from '@/stores/authStore';

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  { label: '数据看板', path: '/admin', icon: LayoutDashboard, roles: ['police', 'data_bureau', 'admin'] },
  { label: '审批中心', path: '/admin/approvals', icon: ClipboardCheck, roles: ['police', 'admin'] },
  { label: '服务管理', path: '/admin/services', icon: Settings, roles: ['police', 'data_bureau', 'admin'] },
  { label: '监控统计', path: '/admin/monitor', icon: Activity, roles: ['data_bureau', 'admin'] },
  { label: '访问审计', path: '/admin/audit', icon: ShieldAlert, roles: ['police', 'data_bureau', 'admin'] },
  { label: '行为热力图', path: '/admin/heatmap', icon: Flame, roles: ['police', 'data_bureau', 'admin'] },
];

const governanceItems: NavItem[] = [
  { label: '市公安局管理', path: '/admin/police', icon: Shield, roles: ['data_bureau', 'admin'] },
  { label: '市数据局管理', path: '/admin/data-bureau', icon: Database, roles: ['data_bureau', 'admin'] },
];

const roleOptions: { key: AdminRole; label: string }[] = [
  { key: 'police', label: '市公安局' },
  { key: 'data_bureau', label: '市数据局' },
  { key: 'admin', label: '系统管理员' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, adminRole, setAdminRole } = useAuthStore();
  const [govExpanded, setGovExpanded] = useState(true);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user?.role === 'dept_admin' ? '部门管理员' : user?.role === 'data_admin' ? '数据管理员' : '管理员';

  const visibleNavItems = navItems.filter((item) => item.roles.includes(adminRole));
  const visibleGovItems = governanceItems.filter((item) => item.roles.includes(adminRole));

  return (
    <div className="min-h-screen flex bg-gov-bg">
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col shrink-0 fixed h-full z-40">
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-gov-blue-light" />
            <span className="text-lg font-bold tracking-wide">昆山政务通·管理后台</span>
          </Link>
        </div>

        <div className="px-3 py-3 border-b border-white/10">
          <div className="flex rounded-lg overflow-hidden bg-white/5 border border-white/10">
            {roleOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAdminRole(opt.key)}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-all duration-200 ${
                  adminRole === opt.key
                    ? 'bg-gov-blue text-white shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {visibleNavItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-blue-900/50 text-white border-l-4 border-gov-blue-light font-medium'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}

          {visibleGovItems.length > 0 && (
            <div className="pt-2 pb-1">
              <button
                onClick={() => setGovExpanded(!govExpanded)}
                className="flex items-center gap-2 px-4 py-2 w-full text-white/40 hover:text-white/60 transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${govExpanded ? '' : '-rotate-90'}`} />
                <span className="text-xs font-medium uppercase tracking-wider">协同治理</span>
              </button>
              {govExpanded && (
                <div className="space-y-1 mt-1">
                  {visibleGovItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-blue-900/50 text-white border-l-4 border-gov-blue-light font-medium'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {visibleNavItems.slice(3).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-blue-900/50 text-white border-l-4 border-gov-blue-light font-medium'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>系统运行正常</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gov-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div />

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gov-text-secondary hover:text-gov-text transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {user && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gov-blue flex items-center justify-center text-white text-sm font-bold">
                  {user.name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gov-text">{user.name}</span>
                  <span className="text-xs text-gov-text-secondary">{roleLabel}</span>
                </div>
                <span className="gov-badge bg-blue-100 text-gov-blue">{roleLabel}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gov-text-secondary hover:text-red-500 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
