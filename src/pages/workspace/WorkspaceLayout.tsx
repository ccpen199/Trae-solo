import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShoppingBag, 
  Wallet, 
  Settings, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { path: '/workspace/dashboard', label: '数据概览', icon: LayoutDashboard },
  { path: '/workspace/courses', label: '课程管理', icon: BookOpen },
  { path: '/workspace/orders', label: '订单管理', icon: ShoppingBag },
  { path: '/workspace/earnings', label: '收入结算', icon: Wallet },
  { path: '/workspace/settings', label: '账号设置', icon: Settings },
];

export default function WorkspaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, mobileSidebarOpen, setSidebarCollapsed, setMobileSidebarOpen } = useWorkspaceStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavItem = ({ item, isMobile = false }: { item: typeof navItems[0]; isMobile?: boolean }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    
    return (
      <NavLink
        to={item.path}
        onClick={() => isMobile && setMobileSidebarOpen(false)}
        className={({ isActive: navActive }) =>
          cn(
            'nav-link mb-1',
            (navActive || isActive) && 'nav-link-active',
            sidebarCollapsed && !isMobile && 'justify-center px-2'
          )
        }
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden w-64 transform flex-col border-r border-zinc-200 bg-white transition-all duration-300 lg:flex',
          sidebarCollapsed && 'w-16',
          mobileSidebarOpen && 'flex translate-x-0',
          !mobileSidebarOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
          {!sidebarCollapsed && (
            <span className="font-display text-xl font-bold text-gradient">创作者中心</span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:block"
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <button
            onClick={handleLogout}
            className={cn(
              'nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={cn(
        'flex min-h-screen flex-1 flex-col transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-zinc-900">
              {navItems.find(n => location.pathname.startsWith(n.path))?.label || '创作者中心'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-zinc-900">{user?.username}</p>
                <p className="text-xs text-zinc-500">{user?.role === 'admin' ? '管理员' : '创作者'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-zinc-200 bg-white py-2 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors',
                  isActive ? 'text-primary-600' : 'text-zinc-500'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="h-20 lg:hidden" />
      </div>
    </div>
  );
}
