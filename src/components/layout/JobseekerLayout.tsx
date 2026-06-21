import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  FileUser,
  Send,
  Calendar,
  KeyRound,
  ArrowLeftRight,
} from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/jobseeker/home', label: '首页', icon: Home },
  { path: '/jobseeker/resume', label: '简历', icon: FileUser },
  { path: '/jobseeker/applications', label: '投递记录', icon: Send },
  { path: '/jobseeker/interviews', label: '面试管理', icon: Calendar },
  { path: '/jobseeker/authorizations', label: '授权管理', icon: KeyRound },
];

export default function JobseekerLayout() {
  const { currentUser, setActiveRole } = useStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-8">
        <Link to="/jobseeker/home" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-serif text-lg font-bold text-white">
            匹
          </div>
          <span className="font-serif text-lg font-bold tracking-wide text-primary">
            智聘匹配
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-200',
                  active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
            <span className="hidden text-sm font-medium text-gray-800 sm:block">
              {currentUser?.name || '用户'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>

      <footer className="hidden border-t border-gray-200 bg-white px-8 py-4 md:block">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>© 2026 智聘匹配</span>
          <button
            onClick={() => setActiveRole('employer')}
            className="flex items-center gap-1.5 text-primary transition-colors hover:text-accent"
          >
            <ArrowLeftRight className="h-4 w-4" />
            切换为雇主
          </button>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-gray-200 bg-white py-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
                active ? 'text-accent' : 'text-gray-500',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span className={active ? 'font-medium' : ''}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
