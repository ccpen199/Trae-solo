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
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { getSession } from '@/auth';

const MENU_CONFIG: Array<{
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  permissionKey: string;
  group: string;
}> = [
  { path: '/', label: '运营总览', icon: LayoutDashboard, permissionKey: 'dashboard', group: '运营中心' },
  { path: '/citizens', label: '市民管理', icon: Users, permissionKey: 'citizens', group: '身份主干' },
  { path: '/transactions', label: '交易流水', icon: Receipt, permissionKey: 'transactions', group: '交易中心' },
  { path: '/transport', label: '交通卡管理', icon: CreditCard, permissionKey: 'transport', group: '交通域' },
  { path: '/transport-top', label: '异地使用排行', icon: TrendingUp, permissionKey: 'transport-top', group: '交通域' },
  { path: '/scenics', label: '景区管理', icon: MapPin, permissionKey: 'scenics', group: '文旅域' },
  { path: '/scenic-heatmap', label: '入园热力图', icon: Map, permissionKey: 'scenic-heatmap', group: '文旅域' },
  { path: '/enterprises', label: '企业服务', icon: Building2, permissionKey: 'enterprises', group: '企业域' },
  { path: '/merchants', label: '商户管理', icon: Store, permissionKey: 'merchants', group: '商业域' },
  { path: '/fusing', label: '熔断规则', icon: Shield, permissionKey: 'fusing', group: '风控审计' },
  { path: '/audit', label: '审计日志', icon: Settings, permissionKey: 'audit', group: '风控审计' },
];

const ROLE_LABEL: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '市级运营管理员',
  scenic_admin: '景区运营管理员',
  merchant_admin: '商户运营管理员',
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: 'bg-red-50 text-red-600',
  admin: 'bg-primary-50 text-primary-600',
  scenic_admin: 'bg-secondary-50 text-secondary-600',
  merchant_admin: 'bg-accent-50 text-accent-600',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = useAppStore((state) => state.logout);
  const user = useAppStore((state) => state.user);
  const hydrate = useAppStore((state) => state.hydrateFromStorage);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    hydrate();
    const session = getSession();
    if (session?.user?.permissions) {
      setPermissions(session.user.permissions);
    } else if (user?.permissions) {
      setPermissions(user.permissions);
    } else {
      setPermissions([]);
    }
  }, [user, hydrate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    setTimeout(() => window.location.reload(), 50);
  };

  const grouped = MENU_CONFIG.reduce<Record<string, typeof MENU_CONFIG>>((acc, item) => {
    if (permissions.includes(item.permissionKey)) {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
    }
    return acc;
  }, {});

  const displayUser = user || getSession()?.user || null;

  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 shadow-card flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <span className="text-white font-bold text-lg">苏</span>
        </div>
        <div className="ml-3">
          <h1 className="text-base font-bold text-gray-800">苏州城市数字服务中台</h1>
          <p className="text-xs text-gray-500">运营管理平台</p>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-4">
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
              {group}
            </div>
            <ul className="space-y-1 mt-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-float'
                            : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                        }`
                      }
                    >
                      <Icon size={17} className="mr-3" />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-3 mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-bold">{displayUser?.name?.[0] || 'U'}</span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{displayUser?.name || '未登录'}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${ROLE_COLOR[displayUser?.role || ''] || 'bg-gray-100 text-gray-600'}`}>
                {ROLE_LABEL[displayUser?.role || ''] || '未知角色'}
              </span>
            </div>
          </div>
          {displayUser?.district && (
            <div className="mt-2 text-[11px] text-gray-500 flex items-center">
              <MapPin size={11} className="mr-1" />
              管辖：{displayUser.district}
            </div>
          )}
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
