import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileText,
  BookOpen,
  FileCheck,
  MessageSquareWarning,
  ShieldCheck,
  Hammer,
  Link2,
  FolderOpen,
  Coins,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '首页概览' },
  { path: '/enterprises', icon: Building2, label: '企业管理' },
  { path: '/services', icon: FileText, label: '政务服务' },
  { path: '/services/guide', icon: BookOpen, label: '智能导办' },
  { path: '/policies', icon: FileCheck, label: '政策匹配' },
  { path: '/appeals', icon: MessageSquareWarning, label: '诉求管理' },
  { path: '/credit', icon: ShieldCheck, label: '信用档案' },
  { path: '/bidding', icon: Hammer, label: '招标投标' },
  { path: '/supply-chain', icon: Link2, label: '供应链管理' },
  { path: '/materials', icon: FolderOpen, label: '材料复用' },
  { path: '/finance', icon: Coins, label: '金融服务' },
];

export default function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-[#1a56db] min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-[#1e3a8a]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#1a56db]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">广东省涉企政务服务平台</h1>
            <p className="text-blue-200 text-xs">Guangdong Enterprise Services</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'sidebar-link',
              isActive(item.path) && 'sidebar-link-active'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-[#1e3a8a]/50">
        <div className="mb-4 px-4 py-3 bg-[#1e3a8a]/50 rounded-lg">
          <p className="text-white font-medium text-sm">{user?.name || '管理员'}</p>
          <p className="text-blue-200 text-xs">{user?.department || '政务服务中心'}</p>
        </div>
        <button
          type="button"
          className="sidebar-link w-full"
        >
          <UserCircle className="w-5 h-5" />
          <span>个人中心</span>
        </button>
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-300 hover:text-red-100 hover:bg-red-900/30"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
