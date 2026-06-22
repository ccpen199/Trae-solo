import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  ShieldCheck,
  Wallet,
  Menu,
  X,
  Camera,
  Bell,
  Search,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    label: '数据看板',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'SKU管理',
    path: '/admin/sku',
    icon: Package,
  },
  {
    label: '运费规则',
    path: '/admin/shipping',
    icon: Truck,
  },
  {
    label: '版权审核',
    path: '/admin/copyright',
    icon: ShieldCheck,
  },
  {
    label: '财务对账',
    path: '/admin/finance',
    icon: Wallet,
  },
];

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper-100">
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-paper-900 text-paper-200 z-40',
          'transition-all duration-300 ease-in-out',
          'lg:block',
          sidebarOpen ? 'w-64' : 'lg:w-20',
          mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-paper-800">
            <div className="flex items-center gap-2">
              <Camera className="w-7 h-7 text-brand-400 flex-shrink-0" />
              {(sidebarOpen || mobileMenuOpen) && (
                <span className="font-display font-semibold text-lg text-white truncate">
                  光影管理后台
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-paper-800 transition-colors"
            >
              <ChevronRight
                className={cn(
                  'w-5 h-5 text-paper-400 transition-transform',
                  sidebarOpen ? '' : 'rotate-180'
                )}
              />
            </button>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-brand-500/15 text-brand-400'
                      : 'text-paper-400 hover:bg-paper-800/50 hover:text-paper-200',
                    !sidebarOpen && !mobileMenuOpen && 'lg:justify-center'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {(sidebarOpen || mobileMenuOpen) && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-paper-800">
            {(sidebarOpen || mobileMenuOpen) ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center">
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">管理员</p>
                  <p className="text-xs text-paper-500 truncate">admin@guangying.com</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center lg:block">
                <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center">
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300',
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={cn(
          'transition-all duration-300',
          'lg:ml-64',
          !sidebarOpen && 'lg:ml-20'
        )}
      >
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-paper-200 shadow-sm">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-paper-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-paper-700" />
                ) : (
                  <Menu className="w-5 h-5 text-paper-700" />
                )}
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-paper-500">
                <span>管理后台</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-paper-700 font-medium">
                  {menuItems.find((item) =>
                    location.pathname.startsWith(item.path)
                  )?.label || '数据看板'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="w-56 pl-9 pr-3 py-2 text-sm rounded-lg border border-paper-200 bg-paper-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white transition-all"
                />
              </div>
              <button className="relative p-2 rounded-lg hover:bg-paper-100 transition-colors">
                <Bell className="w-5 h-5 text-paper-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
