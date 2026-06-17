import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, Package, ClipboardList, Wallet, User, Store, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function MerchantLayout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/merchant', icon: LayoutGrid, label: '工作台' },
    { to: '/merchant/products', icon: Package, label: '商品' },
    { to: '/merchant/orders', icon: ClipboardList, label: '订单' },
    { to: '/merchant/finance', icon: Wallet, label: '财务' },
    { to: '/merchant/dispatch', icon: User, label: '我的' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[480px] min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-40 bg-gradient-to-r from-success-600 to-success-700 text-white shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">商户端</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5" />
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

        <main className="flex-1 overflow-auto pb-20">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/merchant'}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-colors ${
                      isActive ? 'text-success-600' : 'text-gray-400 hover:text-gray-600'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
