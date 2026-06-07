import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Box,
  Package,
  Truck,
  Archive,
  Shirt,
  Sparkles,
  Settings,
  Bell,
  Ticket,
  BarChart3,
  Users,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const menuGroups: MenuGroup[] = [
    {
      label: '主要功能',
      items: [
        {
          path: '/',
          label: '控制面板',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          path: '/cabinets',
          label: '柜子管理',
          icon: <Box className="w-5 h-5" />,
        },
        {
          path: '/compartments',
          label: '格子管理',
          icon: <Archive className="w-5 h-5" />,
        },
        {
          path: '/packages',
          label: '包裹管理',
          icon: <Package className="w-5 h-5" />,
        },
      ],
    },
    {
      label: '服务中心',
      items: [
        {
          path: '/shipping',
          label: '快递服务',
          icon: <Truck className="w-5 h-5" />,
        },
        {
          path: '/storage',
          label: '存储服务',
          icon: <Archive className="w-5 h-5" />,
        },
        {
          path: '/laundry',
          label: '洗衣服务',
          icon: <Shirt className="w-5 h-5" />,
        },
        {
          path: '/housekeeping',
          label: '家政服务',
          icon: <Sparkles className="w-5 h-5" />,
        },
      ],
    },
    {
      label: '管理中心',
      items: [
        {
          path: '/admin/cabinet-monitor',
          label: '运营监控',
          icon: <Settings className="w-5 h-5" />,
        },
        {
          path: '/admin/quality-board',
          label: '质量看板',
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          path: '/admin/cross-recommend',
          label: '交叉推荐',
          icon: <Users className="w-5 h-5" />,
        },
      ],
    },
    {
      label: '其他',
      items: [
        {
          path: '/notifications',
          label: '消息通知',
          icon: <Bell className="w-5 h-5" />,
          badge: 3,
        },
        {
          path: '/coupons',
          label: '优惠券中心',
          icon: <Ticket className="w-5 h-5" />,
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">智能柜中台</h1>
            <p className="text-xs text-slate-500">Smart Cabinet Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <div className="px-5 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {group.label}
              </span>
            </div>
            <nav className="space-y-1 px-3">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-sky-50 text-sky-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    )
                  }
                >
                  <span className={cn(
                    'flex-shrink-0',
                    location.pathname === item.path ? 'text-sky-500' : 'text-slate-400'
                  )}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
