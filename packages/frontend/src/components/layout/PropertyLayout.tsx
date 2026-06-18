import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  CreditCard,
  Wrench,
  MessageCircleWarning,
  Megaphone,
  Settings,
  Bell,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import clsx from 'clsx';

const navItems = [
  { to: '/property/dashboard', icon: LayoutDashboard, label: '工作台' },
  { to: '/property/residents', icon: Users, label: '住户管理' },
  { to: '/property/access-control', icon: DoorOpen, label: '门禁管理' },
  { to: '/property/bills', icon: CreditCard, label: '缴费管理' },
  { to: '/property/repairs', icon: Wrench, label: '报修管理' },
  { to: '/property/complaints', icon: MessageCircleWarning, label: '投诉管理' },
  { to: '/property/notifications', icon: Megaphone, label: '通知管理' },
  { to: '/property/settings', icon: Settings, label: '系统设置' },
];

export default function PropertyLayout() {
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
          'fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-community-green flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="ml-2 font-bold text-gray-800">物业管理系统</span>
        </div>
        <nav className="mt-2 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
            <span className="text-lg font-semibold text-gray-800">物业工作台</span>
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
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                  物
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.nickname || '物业人员'}
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
