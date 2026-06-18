import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
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
  Home,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { getRoleLabel } from '@/mock/auth';
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

const roleBadgeColors: Record<string, string> = {
  property_admin: 'bg-green-100 text-green-700',
  property_staff: 'bg-orange-100 text-orange-700',
};

export default function PropertyLayout() {
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

  const isPropertyAdmin = user?.role === 'property_admin';

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div className="ml-2">
            <span className="font-bold text-gray-800 text-sm">物业管理系统</span>
            <div className="text-xs text-gray-400">{communityName}</div>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {(user?.realName || user?.nickname || '物').charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {user?.nickname || '物业人员'}
              </div>
              <span
                className={clsx(
                  'text-xs px-1.5 py-0.5 rounded',
                  roleBadgeColors[user?.role || 'property_staff']
                )}
              >
                {getRoleLabel(user?.role || 'property_staff')}
              </span>
            </div>
          </div>
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

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
            <span className="text-lg font-semibold text-gray-800">物业工作台</span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs bg-green-50 text-green-600 rounded">
              {isPropertyAdmin ? '物业管理员' : '物业员工'}
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  {(user?.realName || user?.nickname || '物').charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.nickname || '物业人员'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getRoleLabel(user?.role || 'property_staff')}
                  </div>
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-800">
                      {user?.nickname || '物业人员'}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{user?.phone}</div>
                    <span
                      className={clsx(
                        'inline-block mt-2 text-xs px-2 py-0.5 rounded',
                        roleBadgeColors[user?.role || 'property_staff']
                      )}
                    >
                      {getRoleLabel(user?.role || 'property_staff')}
                    </span>
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
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    个人资料
                  </Link>
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
