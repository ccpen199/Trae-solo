import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  User,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

const sidebarItems = [
  { label: '仪表盘', href: '/admin', icon: LayoutDashboard },
  { label: '举报管理', href: '/admin/reports', icon: AlertTriangle },
  { label: '经纪人管理', href: '/admin/brokers', icon: Users },
  { label: '市场健康度', href: '/admin/market-health', icon: Activity },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside
        className={cn(
          'bg-primary-900 text-white flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-primary-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-accent-verified" />
              <span className="font-bold font-serif">管理后台</span>
            </div>
          )}
          {collapsed && <Building2 className="w-6 h-6 text-accent-verified mx-auto" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-primary-800 rounded transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors mb-1',
                  isActive
                    ? 'bg-primary-800 text-accent-verified'
                    : 'text-primary-100 hover:bg-primary-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-primary-700 p-4">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.nickname || '管理员'}
                  </p>
                  <p className="text-xs text-primary-300 truncate">
                    {user?.role === 'admin' ? '系统管理员' : user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-100 hover:bg-primary-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-primary-100 hover:bg-primary-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">管理控制台</h1>
            <p className="text-xs text-gray-500">房产全周期价格治理平台</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
