import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Package,
  ClipboardList,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const menuItems = [
  { label: '数据看板', href: '/admin', icon: LayoutDashboard },
  { label: '影片管理', href: '/admin/movies', icon: Film },
  { label: '库存管理', href: '/admin/inventory', icon: Package },
  { label: '订单管理', href: '/admin/orders', icon: ClipboardList },
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    console.log('Logout');
  };

  return (
    <div className="min-h-screen flex bg-cinema-midnight">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-cinema-midnightDark border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Film className="w-5 h-5 text-cinema-midnight" />
              </div>
              <div>
                <h1 className="font-display text-lg text-gradient-gold tracking-wider leading-tight">
                  PACONNIE
                </h1>
                <p className="text-xs text-cinema-muted">管理后台</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-cinema-goldDark/20 to-cinema-goldLight/10 text-cinema-gold border border-cinema-gold/30'
                      : 'text-white/70 hover:text-cinema-gold hover:bg-cinema-midnightLight'
                  )}
                >
                  <Icon className={cn('w-5 h-5', active ? 'text-cinema-gold' : '')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-cinema-midnightLight">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-cinema-midnight" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">管理员</p>
                <p className="text-xs text-cinema-muted truncate">admin@paconnie.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-cinema-midnight/80 backdrop-blur-lg border-b border-white/5">
          <div className="flex items-center justify-between h-full px-6">
            <button
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-cinema-gold hover:bg-cinema-midnightLight transition-all"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-white">
                {menuItems.find((item) => isActive(item.href))?.label || '管理后台'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-cinema-red hover:bg-cinema-midnightLight transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">退出登录</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
