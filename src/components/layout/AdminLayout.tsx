import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Settings,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Hotel,
  Bell,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore, selectUser } from '../../store/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore(selectUser);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/hotel-admin' },
    { id: 'bookings', label: '订单管理', icon: CalendarDays, path: '/hotel-admin/bookings' },
    { id: 'rooms', label: '房态管理', icon: BedDouble, path: '/hotel-admin/rooms' },
    { id: 'settings', label: '酒店设置', icon: Settings, path: '/hotel-admin/settings' },
    { id: 'finance', label: '财务结算', icon: Wallet, path: '/hotel-admin/finance' },
  ];

  const getBreadcrumb = (): string => {
    const path = location.pathname;
    const item = menuItems.find(m => m.path === path || path.startsWith(m.path + '/'));
    return item?.label || '仪表盘';
  };

  const isActive = (path: string): boolean => {
    if (path === '/hotel-admin') {
      return location.pathname === '/hotel-admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
  };

  return (
    <div className="min-h-screen bg-cloud-50 flex">
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-deep-blue text-white rounded-lg lg:hidden shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-deep-blue-900 text-white flex flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn(
          'flex items-center h-16 border-b border-deep-blue-800 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold-foil rounded-lg flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-deep-blue-900" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">酒店管理</p>
                  <p className="text-xs text-deep-blue-400">StayGlobal</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1 hover:bg-deep-blue-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="w-8 h-8 bg-gold-foil rounded-lg flex items-center justify-center">
              <Hotel className="w-5 h-5 text-deep-blue-900" />
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-deep-blue-800">
            <p className="text-xs text-deep-blue-400 mb-1">当前酒店</p>
            <p className="font-medium text-sm truncate">Le Château Élysée</p>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      active
                        ? 'bg-gold-foil/20 text-gold-foil border-l-2 border-gold-foil'
                        : 'text-deep-blue-200 hover:bg-deep-blue-800 hover:text-white',
                      collapsed && 'justify-center'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-deep-blue-800 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 text-deep-blue-400 hover:text-white hover:bg-deep-blue-800 rounded-lg transition-colors"
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-300',
        collapsed ? 'lg:ml-16' : 'lg:ml-60'
      )}>
        <header className="h-16 bg-white border-b border-cloud-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 ml-10 lg:ml-0">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/hotel-admin" className="text-graphite-400 hover:text-deep-blue">
                酒店后台
              </Link>
              <span className="text-graphite-300">/</span>
              <span className="text-graphite-700 font-medium">{getBreadcrumb()}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-graphite-500 hover:text-deep-blue hover:bg-cloud-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-orange rounded-full" />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-cloud-200">
              <div className="w-8 h-8 bg-deep-blue/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-deep-blue" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-graphite-900">
                  {user?.firstName || '管理员'}
                </p>
                <p className="text-xs text-graphite-500">
                  {user?.role === 'HOTEL_ADMIN' ? '酒店管理员' : '酒店员工'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-graphite-500 hover:text-coral-orange hover:bg-coral-orange/10 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
