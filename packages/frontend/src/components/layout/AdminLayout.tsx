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
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import clsx from 'clsx';

const navItems = [
  { to: '/admin', icon: BarChart3, label: '数据概览', end: true },
  { to: '/admin/community-health', icon: Building2, label: '社区管理' },
  { to: '/admin/trace-logs', icon: Eye, label: '话题监控' },
  { to: '/admin/transactions', icon: ShoppingCart, label: '交易管理' },
  { to: '/admin/risk-control', icon: Shield, label: '风控中心' },
  { to: '/admin/partners', icon: Users, label: '合伙人管理' },
  { to: '/admin/property-integration', icon: Link2, label: '物业对接' },
  { to: '/admin/system-settings', icon: Settings, label: '系统设置' },
];

export default function AdminLayout() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-56 bg-gray-900 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="ml-2 font-bold text-white">管理后台</span>
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
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
                  管
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.nickname || '管理员'}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
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
