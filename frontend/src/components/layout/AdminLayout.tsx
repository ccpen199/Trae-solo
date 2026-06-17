import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Users,
  AlertTriangle,
  Hand,
  Ticket,
  Building2,
  Wallet,
  Zap,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const menuItems = [
  { to: '/admin', icon: LayoutDashboard, label: '运营看板', end: true },
  { to: '/admin/heatmap', icon: Map, label: '热力图' },
  { to: '/admin/riders', icon: Users, label: '骑手活跃' },
  { to: '/admin/anomaly', icon: AlertTriangle, label: '异常监控' },
  { to: '/admin/intervention', icon: Hand, label: '人工干预' },
  { to: '/admin/tickets', icon: Ticket, label: '工单管理' },
  { to: '/admin/cities', icon: Building2, label: '城市管理' },
  { to: '/admin/finance', icon: Wallet, label: '财务管理' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentItem = menuItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-admin-900 text-gray-200 flex flex-col z-30">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-admin-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-base">闪跑运营</div>
            <div className="text-xs text-gray-400">同城跑腿平台</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'text-gray-400 hover:bg-admin-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-admin-800 p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-admin-800/50">
            <div className="w-9 h-9 rounded-full bg-admin-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.nickname || '管理员'}
              </div>
              <div className="text-xs text-gray-400">{user?.role || 'admin'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-admin-700 text-gray-400 hover:text-white transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-60 flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentItem?.label || '运营看板'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
