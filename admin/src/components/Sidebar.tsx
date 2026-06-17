import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  MapPin,
  Building2,
  Store,
  Shield,
  Settings,
  LogOut,
  TrendingUp,
  Map,
} from 'lucide-react';
import { useAppStore } from '@/store';

const menuItems = [
  { path: '/', label: '运营总览', icon: LayoutDashboard },
  { path: '/citizens', label: '市民管理', icon: Users },
  { path: '/transactions', label: '交易流水', icon: Receipt },
  { path: '/transport', label: '交通卡管理', icon: CreditCard },
  { path: '/scenics', label: '景区管理', icon: MapPin },
  { path: '/scenic-heatmap', label: '入园热力图', icon: Map },
  { path: '/enterprises', label: '企业服务', icon: Building2 },
  { path: '/merchants', label: '商户管理', icon: Store },
  { path: '/transport-top', label: '异地使用排行', icon: TrendingUp },
  { path: '/fusing', label: '熔断规则', icon: Shield },
  { path: '/audit', label: '审计日志', icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = useAppStore((state) => state.logout);
  const user = useAppStore((state) => state.user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 shadow-card flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <span className="text-white font-bold text-lg">苏</span>
        </div>
        <div className="ml-3">
          <h1 className="text-base font-bold text-gray-800">苏州城市数字服务中台</h1>
          <p className="text-xs text-gray-500">运营管理平台</p>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-float'
                        : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                    }`
                  }
                >
                  <Icon size={18} className="mr-3" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-bold">{user?.name?.[0]}</span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'super_admin' ? '超级管理员' : '管理员'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={16} className="mr-2" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
