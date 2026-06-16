import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  PawPrint,
  MessageCircle,
  MapPin,
  ShoppingBag,
  Users,
  Calendar,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/pets', icon: PawPrint, label: '宠物档案' },
  { path: '/consultations', icon: MessageCircle, label: '在线问诊' },
  { path: '/hospitals', icon: MapPin, label: '附近医院' },
  { path: '/shop', icon: ShoppingBag, label: '宠物商城' },
  { path: '/community', icon: Users, label: '宠物社区' },
  { path: '/calendar', icon: Calendar, label: '健康日历' },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const isDoctor = user?.role === 'doctor';
  const finalNavItems = isDoctor
    ? [{ path: '/doctor/dashboard', icon: Stethoscope, label: '工作台' }, ...navItems.slice(2)]
    : navItems;

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-forest-100 flex flex-col transform transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-forest-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-gray-900">萌宠健康</h1>
                <p className="text-xs text-gray-500">PetCare Pro</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-forest-50"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {finalNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200',
                  isActive
                    ? 'bg-forest-500 text-white shadow-soft'
                    : 'text-gray-600 hover:bg-forest-50 hover:text-forest-700'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {isAuthenticated && user && (
          <div className="p-4 border-t border-forest-50">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50">
              <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-forest-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.nickname}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role === 'owner' && '宠物主人'}
                  {user.role === 'doctor' && '执业兽医'}
                  {user.role === 'hospital' && '医院管理员'}
                  {user.role === 'merchant' && '商家'}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-forest-50">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-forest-50"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="font-display font-semibold text-gray-900">
                  {finalNavItems.find((item) => item.path === location.pathname)?.label || '首页'}
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {new Date().toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-xl hover:bg-forest-50 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warm-400 rounded-full" />
              </button>

              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-forest-50 transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-forest-600" />
                    )}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-hover border border-forest-100 overflow-hidden animate-fade-in-up">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-forest-50 transition-colors"
                      onClick={() => {
                        setUserMenuOpen(false);
                      }}
                    >
                      <User className="w-4 h-4" />
                      <span>个人中心</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 overflow-x-hidden">
          <div className="mx-auto max-w-7xl animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-forest-100 px-2 py-2">
          <div className="grid grid-cols-5 gap-1">
            {finalNavItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200',
                    isActive ? 'text-forest-600' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive && 'animate-pulse-soft')} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
