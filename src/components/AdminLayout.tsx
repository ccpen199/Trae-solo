import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  Settings,
  Monitor,
  Ticket,
  BookOpen,
  Users,
  LogOut,
  Landmark,
} from 'lucide-react';

const adminNav = [
  { to: '/admin/services', label: '服务治理', icon: Settings },
  { to: '/admin/monitor', label: '监控大屏', icon: Monitor },
  { to: '/admin/tickets', label: '工单分拨', icon: Ticket },
  { to: '/admin/knowledge', label: '知识库', icon: BookOpen },
  { to: '/admin/users', label: '用户管理', icon: Users },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-warm-100">
      <aside className="w-60 bg-primary text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-primary-light">
          <Landmark className="w-6 h-6" />
          <span className="font-serif-cn font-bold text-sm">管理后台</span>
        </div>
        <nav className="flex-1 py-4">
          {adminNav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  active
                    ? 'bg-primary-light text-white'
                    : 'text-warm-300 hover:bg-primary-light hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-primary-light">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-warm-300 hover:text-white mb-3"
          >
            返回前台
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-warm-300 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-warm-800">
            {adminNav.find((n) => n.to === location.pathname)?.label || '管理后台'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-warm-500">
            <Users className="w-4 h-4" />
            {user?.name || '管理员'}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
