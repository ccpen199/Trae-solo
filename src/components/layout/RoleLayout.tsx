import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  PackagePlus,
  ClipboardList,
  Flame,
  Shield,
  LogOut,
  Truck,
  User,
  Bell,
  ChevronRight,
} from 'lucide-react';
import type { UserRole } from '@/types';

const menuConfig: Record<UserRole, { label: string; path: string; icon: LucideIcon; badge?: string }[]> = {
  SHIPPER: [
    { label: '工作台', path: '/shipper/dashboard', icon: LayoutDashboard },
    { label: '发布货源', path: '/shipper/publish', icon: PackagePlus, badge: 'NEW' },
    { label: '我的订单', path: '/shipper/orders', icon: ClipboardList },
    { label: '发货热力图', path: '/shipper/heatmap', icon: Flame },
    { label: '保险中心', path: '/shipper/insurance', icon: Shield },
  ],
  DRIVER: [
    { label: '工作台', path: '/driver/dashboard', icon: LayoutDashboard },
    { label: '订单大厅', path: '/driver/hall', icon: Truck, badge: 'HOT' },
    { label: '我的订单', path: '/shipper/orders', icon: ClipboardList },
  ],
  ADMIN: [
    { label: '运营大屏', path: '/admin/overview', icon: LayoutDashboard },
    { label: '智能调度中心', path: '/dispatch/center', icon: Truck, badge: 'AI' },
    { label: '运力饱和度预警', path: '/dispatch/saturation', icon: Flame },
    { label: '订单审核', path: '/admin/orders', icon: ClipboardList },
    { label: '用户管理', path: '/admin/users', icon: User },
    { label: '保险管理', path: '/admin/insurance', icon: Shield },
  ],
};

const roleTitles: Record<UserRole, { title: string; subtitle: string }> = {
  SHIPPER: { title: '货主控制台', subtitle: 'SHIPPER CONSOLE' },
  DRIVER: { title: '司机工作台', subtitle: 'DRIVER WORKBENCH' },
  ADMIN: { title: '运营管理中心', subtitle: 'OPS CONTROL CENTER' },
};

export function RoleLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  if (!user) return null;

  const menus = menuConfig[user.role];
  const title = roleTitles[user.role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex w-full bg-ink-950">
      <aside className="w-64 shrink-0 h-screen bg-ink-900/80 border-r border-ink-700/60 backdrop-blur-sm flex flex-col">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-ink-700/40">
          <div className="relative w-11 h-11 flex items-center justify-center rounded-sm bg-gradient-to-br from-orange-500 to-orange-600">
            <Truck size={22} className="text-white" />
            <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-signal-green rounded-full border-2 border-ink-900 animate-pulse-slow" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-white tracking-wide">运联·智调</div>
            <div className="text-[10px] font-mono text-slate-500 tracking-widest">{title.subtitle}</div>
          </div>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-1">
            {menus.map((m) => {
              const Icon = m.icon;
              return (
                <NavLink
                  key={m.path}
                  to={m.path}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-between px-4 py-2.5 rounded-sm text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-orange-500/15 to-transparent shadow-[inset_2px_0_0_0_#F97316]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} className="opacity-80" />
                    <span className="font-medium">{m.label}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {m.badge && (
                      <span className="hex-tag !text-[9px]">{m.badge}</span>
                    )}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="border-t border-ink-700/40 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-9 h-9 rounded-sm border border-ink-600" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.company ?? user.phone}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-signal-red hover:bg-red-500/5 border border-ink-700/40 transition-colors"
          >
            <LogOut size={14} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-ink-700/40 bg-ink-900/60 backdrop-blur-sm flex items-center px-8 gap-6">
          <div>
            <h1 className="text-base font-semibold text-white">{title.title}</h1>
            <div className="text-[11px] font-mono text-slate-500 tracking-wider">
              {new Date().toLocaleDateString('zh-CN')} · SESSION #{Math.floor(Math.random() * 9000 + 1000)}
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-ink-800/50 border border-ink-600/50 rounded-sm">
              <span className="status-dot bg-signal-green animate-pulse-fast" />
              <span className="text-xs font-mono text-slate-400">系统运行正常 · 12节点</span>
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center border border-ink-600/60 text-slate-400 hover:text-white hover:border-ink-500 transition">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-signal-red animate-pulse-fast" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
