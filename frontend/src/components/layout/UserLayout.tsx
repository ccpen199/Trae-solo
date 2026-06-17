import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Plus, User, Bell, Zap, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function UserLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/orders', icon: ClipboardList, label: '订单' },
    { to: '/profile', icon: User, label: '我的' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[480px] min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">闪跑</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="退出登录"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-24">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 pb-safe-area-inset-bottom">
          <div className="relative flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl transition-colors ${
                      isActive ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </NavLink>
              );
            })}

            <NavLink
              to="/order/create"
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/40 flex items-center justify-center text-white hover:scale-105 transition-transform"
            >
              <Plus className="w-7 h-7" />
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  );
}
