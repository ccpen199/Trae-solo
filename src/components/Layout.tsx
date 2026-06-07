import { type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  Home,
  Shield,
  ClipboardList,
  Calendar,
  Stethoscope,
  Users,
  FileText,
  Activity,
  BookOpen,
  BarChart3,
  AlertTriangle,
  Package,
  LogOut,
  Bell,
  MapPin,
} from 'lucide-react';

const navItems = {
  nurse: [
    { to: '/nurse/dashboard', label: '仪表盘', icon: Home },
    { to: '/nurse/verification', label: '资格核验', icon: Shield },
    { to: '/nurse/orders', label: '我的订单', icon: ClipboardList },
  ],
  family: [
    { to: '/family/dashboard', label: '仪表盘', icon: Home },
    { to: '/family/book-service', label: '服务预约', icon: Calendar },
    { to: '/family/orders', label: '我的订单', icon: ClipboardList },
  ],
  admin: [
    { to: '/admin/dashboard', label: '仪表盘', icon: Home },
    { to: '/admin/services', label: '服务管理', icon: Package },
    { to: '/admin/dispatch', label: '智能派单', icon: MapPin },
    { to: '/admin/nurses', label: '护士管理', icon: Users },
    { to: '/admin/insurance', label: '保险管理', icon: Shield },
    { to: '/admin/audit', label: '审计日志', icon: FileText },
    { to: '/admin/adverse-events', label: '不良事件', icon: AlertTriangle },
    { to: '/admin/education', label: '继续教育', icon: BookOpen },
    { to: '/admin/quality', label: '质量看板', icon: BarChart3 },
  ],
  regulator: [
    { to: '/admin/dashboard', label: '仪表盘', icon: Home },
    { to: '/admin/services', label: '服务管理', icon: Package },
    { to: '/admin/dispatch', label: '智能派单', icon: MapPin },
    { to: '/admin/nurses', label: '护士管理', icon: Users },
    { to: '/admin/insurance', label: '保险管理', icon: Shield },
    { to: '/admin/audit', label: '审计日志', icon: FileText },
    { to: '/admin/adverse-events', label: '不良事件', icon: AlertTriangle },
    { to: '/admin/education', label: '继续教育', icon: BookOpen },
    { to: '/admin/quality', label: '质量看板', icon: BarChart3 },
  ],
};

const roleLabels: Record<string, string> = {
  nurse: '护士',
  family: '家属',
  admin: '管理员',
  regulator: '监管员',
};

const roleColors: Record<string, string> = {
  nurse: 'bg-cyan-100 text-cyan-800',
  family: 'bg-green-100 text-green-800',
  admin: 'bg-blue-100 text-blue-800',
  regulator: 'bg-amber-100 text-amber-800',
};

export default function Layout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || 'nurse';
  const items = navItems[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-[#1E293B] text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#0F6CBD]" />
            <span className="text-lg font-bold">护理服务平台</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#0F6CBD] text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <button className="relative p-1 text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[role]}`}>
                {roleLabels[role]}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
