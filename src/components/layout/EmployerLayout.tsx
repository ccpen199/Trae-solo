import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  Users,
  CalendarCheck,
  BarChart3,
  FileText,
  MessageSquareWarning,
  Bell,
  LogOut,
  ArrowLeftRight,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/employer/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/employer/verification', label: '资质核验', icon: ShieldCheck },
  { path: '/employer/jobs', label: '岗位管理', icon: Briefcase },
  { path: '/employer/talent', label: '人才库', icon: Users },
  { path: '/employer/interviews', label: '面试邀约', icon: CalendarCheck },
  { path: '/employer/analytics', label: '招聘分析', icon: BarChart3 },
  { path: '/employer/contracts', label: '合同管理', icon: FileText },
  { path: '/employer/disputes', label: '争议调解', icon: MessageSquareWarning },
];

export default function EmployerLayout() {
  const { currentUser, activeRole, setActiveRole, logout } = useStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed z-30 flex h-full w-60 flex-col bg-[#1E3A5F] text-white transition-transform duration-300 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-serif text-lg font-bold">
            匹
          </div>
          <span className="font-serif text-lg font-bold tracking-wide">智聘匹配</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200',
                  active
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-accent" />
                )}
                <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-accent' : 'text-white/60 group-hover:text-white/90')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-2">
          <button
            onClick={() => setActiveRole('jobseeker')}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeftRight className="h-4 w-4" />
            切换为求职者
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-danger/20 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="flex items-center gap-3">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                  {currentUser?.name?.charAt(0) || '用'}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{currentUser?.name || '用户'}</p>
                <p className="text-xs text-gray-500">
                  {activeRole === 'employer' ? '雇主' : '求职者'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
