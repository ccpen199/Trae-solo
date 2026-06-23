import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Users,
  Globe,
  Rocket,
  Zap,
  Wallet,
  BookOpen,
  User,
  LogOut,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台' },
  { path: '/properties', icon: Home, label: '房源管理' },
  { path: '/customers', icon: Users, label: '客源管理' },
  { path: '/crawler', icon: Globe, label: '房源抓取' },
  { path: '/promotion', icon: Rocket, label: '推广中心' },
  { path: '/demands', icon: Zap, label: '抢单大厅' },
  { path: '/commissions', icon: Wallet, label: '佣金结算' },
  { path: '/knowledge', icon: BookOpen, label: '知识社区' },
  { path: '/profile', icon: User, label: '个人中心' },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-primary-900 to-primary-800 text-white flex flex-col shadow-xl">
      <div className="p-5 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg">房介通</h1>
            <p className="text-xs text-primary-300">数字化作业系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <div className="px-3 mb-2">
          <span className="text-xs text-primary-400 font-medium px-2 uppercase tracking-wider">
            业务中心
          </span>
        </div>
        {menuItems.map((item, index) => (
          <NavLink key={item.path} to={item.path} className="block px-3 mb-1">
            <div
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              style={{
                animationDelay: `${index * 30}ms`,
              }}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-primary-500 flex items-center justify-center text-sm font-bold shadow-lg">
            {user?.name?.charAt(0) || '用'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || '经纪人'}</p>
            <p className="text-xs text-primary-300 truncate">{user?.phone || ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gold-400">{user?.points || 0}</span>
            <span className="text-xs text-gold-500">积分</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-800/50 hover:bg-primary-800 text-primary-200 hover:text-white transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">退出登录</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
