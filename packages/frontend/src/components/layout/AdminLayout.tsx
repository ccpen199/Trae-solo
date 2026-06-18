import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Eye,
  ShoppingCart,
  Shield,
  Users,
  Link2,
  Settings,
  Bell,
  LogOut,
  Menu,
  Home,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { getRoleLabel } from '@/mock/auth';
import clsx from 'clsx';

const navItems = [
  { to: '/admin', icon: BarChart3, label: '数据概览', end: true },
  { to: '/admin/community-health', icon: Building2, label: '社区健康度' },
  { to: '/admin/trace-logs', icon: Eye, label: '话题溯源' },
  { to: '/admin/transactions', icon: ShoppingCart, label: '交易管理' },
  { to: '/admin/risk-control', icon: Shield, label: '风控中心' },
  { to: '/admin/partners', icon: Users, label: '合伙人管理' },
  { to: '/admin/property-integration', icon: Link2, label: '物业对接' },
  { to: '/admin/system-settings', icon: Settings, label: '系统设置' },
];

const roleBadgeColors: Record<string, string> = {
  platform_admin: 'bg-purple-500/20 text-purple-300',
  tenant_admin: 'bg-blue-500/20 text-blue-300',
};

export default function AdminLayout() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const communityName =
    (user as { communityName?: string } | null)?.communityName || '邻里数字基座';

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-56 bg-gray-900 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="ml-2">
            <span className="font-bold text-white text-sm">管理后台</span>
            <div className="text-xs text-gray-400">{communityName}</div>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {(user?.realName || user?.nickname || '管').charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.nickname || '管理员'}
              </div>
              <span
                className={clsx(
                  'text-xs px-1.5 py-0.5 rounded',
                  roleBadgeColors[user?.role || 'tenant_admin']
                )}
              >
                {getRoleLabel(user?.role || 'tenant_admin')}
              </span>
            </div>
          </div>
        </div>

        <nav className="mt-2 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            返回社区主页
          </button>
        </div>
      </aside>

      <div className={clsx('flex-1 lg:ml-56')}>
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-lg font-semibold text-gray-800">平台管理后台</span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded">
              管理员入口
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {(user?.realName || user?.nickname || '管').charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.nickname || '管理员'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getRoleLabel(user?.role || 'tenant_admin')}
                  </div>
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-800">
                      {user?.nickname || '管理员'}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{user?.phone}</div>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Home className="w-4 h-4" />
                    社区主页
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4" />
                    个人资料
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4" />
                    系统设置
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
