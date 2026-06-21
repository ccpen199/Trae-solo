import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, FileSearch, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/admin/dashboard', label: '审核仪表盘', icon: LayoutDashboard },
  { path: '/admin/company-reviews', label: '企业资质审核', icon: Building2 },
  { path: '/admin/job-reviews', label: '岗位内容审核', icon: FileSearch },
];

export default function AdminLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-60 shrink-0 flex-col bg-zinc-900 text-white">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <Shield className="h-7 w-7 text-accent" />
          <span className="font-serif text-lg font-bold tracking-wide">智聘匹配</span>
        </div>

        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-white/90">风控审核后台</h2>
          <p className="mt-0.5 text-xs text-white/50">管理员专用</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'group relative flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200',
                  active
                    ? 'bg-white/15 font-medium text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-accent" />
                )}
                <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-accent' : 'text-white/50 group-hover:text-white/80')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-white/40 text-center">v1.0.0 · 风控审核系统</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-8">
          <h1 className="font-serif text-lg font-bold text-primary">风控审核后台</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
