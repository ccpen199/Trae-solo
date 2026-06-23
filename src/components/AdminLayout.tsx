import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Calendar, ShoppingBag,
  Scale, Heart, Brain, Bell, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const menuItems = [
  { path: '/admin/dashboard', label: '数据总览', icon: LayoutDashboard },
  { path: '/admin/org', label: '组织管理', icon: Building2 },
  { path: '/admin/members', label: '会员管理', icon: Users },
  { path: '/admin/activities', label: '活动管理', icon: Calendar },
  { path: '/admin/mall', label: '商城管理', icon: ShoppingBag },
  { path: '/admin/legal', label: '法律服务', icon: Scale },
  { path: '/admin/aid', label: '帮扶管理', icon: Heart },
  { path: '/admin/psy', label: '心理服务', icon: Brain },
  { path: '/admin/push', label: '消息推送', icon: Bell },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen flex bg-[#0F1923]">
      <aside className="w-56 bg-[#1A1A2E] flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <h1 className="text-white font-bold text-lg">工会管理后台</h1>
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-union-text">
            {menuItems.find((m) => m.path === location.pathname)?.label || '管理后台'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-union-muted">{user?.name || '管理员'}</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {(user?.name || '管')[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-[#F5F3EF]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
