import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MapPin, BookOpen, GraduationCap, Newspaper, Activity, Home, Settings, LogOut, ChevronLeft, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { APP_NAME } from '@/constants/config';
import { UserRole } from '@/constants/enums';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/sanxiaxiang/teams', label: '三下乡', icon: Users },
  { to: '/scholarship/projects', label: '奖学金', icon: GraduationCap },
  { to: '/news', label: '资讯', icon: Newspaper },
  { to: '/activities', label: '实践活动', icon: Activity },
  { to: '/bases', label: '实践基地', icon: MapPin },
  { to: '/credits/apply', label: '学分认定', icon: BookOpen },
  { to: '/dashboard', label: '管理仪表盘', icon: LayoutDashboard, adminOnly: true },
  { to: '/settings', label: '系统设置', icon: Settings, adminOnly: true },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'school_admin' || user?.role === 'department_admin';
  const roleLabel = user?.role ? UserRole[user.role as keyof typeof UserRole]?.label : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-surface-200 flex flex-col transition-all duration-300`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-100">
          {!collapsed && <span className="text-sm font-bold text-primary-800 truncate">{APP_NAME}</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500">
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
        </nav>
        {user && (
          <div className="border-t border-surface-100 p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
                {user.name[0]}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{user.name}</p>
                  <p className="text-xs text-surface-400">{roleLabel}</p>
                </div>
              )}
              {!collapsed && (
                <button onClick={handleLogout} className="p-1 rounded hover:bg-surface-100 text-surface-400 hover:text-danger-500" title="退出登录">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
