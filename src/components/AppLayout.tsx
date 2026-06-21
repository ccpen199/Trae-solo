import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthShallow } from '@/store/auth.ts';
import { Home, MapPin, Receipt, Wallet, LayoutDashboard, Cpu, BarChart3, Coins, LogOut, User, Users, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

const studentNavItems: NavItem[] = [
  { label: '首页', icon: <Home size={20} />, path: '/student' },
  { label: '附近设备', icon: <MapPin size={20} />, path: '/student/devices' },
  { label: '账单中心', icon: <Receipt size={20} />, path: '/student/bills' },
  { label: '账户充值', icon: <Wallet size={20} />, path: '/student/recharge' },
];

const investorNavItems: NavItem[] = [
  { label: '控制台', icon: <LayoutDashboard size={20} />, path: '/investor' },
  { label: '设备管理', icon: <Cpu size={20} />, path: '/investor/devices' },
  { label: '能耗分析', icon: <BarChart3 size={20} />, path: '/investor/analytics' },
  { label: '收益结算', icon: <Coins size={20} />, path: '/investor/revenue' },
];

const adminNavItems: NavItem[] = [
  { label: '系统概览', icon: <LayoutDashboard size={20} />, path: '/admin' },
  { label: '用户管理', icon: <Users size={20} />, path: '/admin/users' },
  { label: '系统设置', icon: <Settings size={20} />, path: '/admin/system' },
];

export default function AppLayout({ children, role }: { children: ReactNode; role: 'student' | 'investor' | 'admin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthShallow((s) => ({ user: s.user, logout: s.logout }));

  const navItems = role === 'student' ? studentNavItems : role === 'investor' ? investorNavItems : adminNavItems;
  const title = role === 'student' ? '校园无感用水' : role === 'investor' ? '投资商管理平台' : '系统管理后台';
  const bgClass = role === 'student' ? 'bg-water-texture' : 'bg-graphite-50';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <header className="bg-gradient-to-r from-deep-blue-800 to-aqua-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl font-display font-bold">水</span>
              </div>
              <h1 className="text-xl font-display font-semibold tracking-wide">{title}</h1>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path || item.path !== '/' && location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      active ? 'bg-white/20 backdrop-blur-sm shadow-inner' : 'hover:bg-white/10'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
                <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center">
                  <User size={14} />
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-white/15 transition-colors"
                title="退出登录"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
        <nav className="md:hidden overflow-x-auto border-t border-white/10">
          <div className="flex px-2 py-2 gap-1 min-w-max">
            {navItems.map((item) => {
              const active = location.pathname === item.path || item.path !== '/' && location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    active ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
