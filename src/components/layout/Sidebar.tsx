import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Hotel,
  Users,
  Cpu,
  Calendar,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Gamepad2,
  Zap,
  Shield,
} from 'lucide-react';
import { useAppStore, useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    group: '经营分析',
    items: [
      { path: '/dashboard', label: '经营数据看板', icon: LayoutDashboard },
    ],
  },
  {
    group: '门店资产',
    items: [
      { path: '/assets/seats', label: '座位管理', icon: Monitor },
      { path: '/assets/rooms', label: '包间/房型', icon: Hotel },
      { path: '/assets/devices', label: '设备管理', icon: Cpu },
    ],
  },
  {
    group: '预订管理',
    items: [
      { path: '/booking', label: '智能订座', icon: Gamepad2 },
      { path: '/hotel/bookings', label: '酒店预订', icon: Calendar },
    ],
  },
  {
    group: '会员体系',
    items: [
      { path: '/members/list', label: '会员列表', icon: Users },
      { path: '/members/levels', label: '段位等级', icon: Zap },
      { path: '/members/exchange', label: '权益兑换', icon: Shield },
    ],
  },
  {
    group: 'IoT监控',
    items: [
      { path: '/iot/monitor', label: '实时监控', icon: Cpu },
      { path: '/iot/alerts', label: '故障预警', icon: Zap },
    ],
  },
  {
    group: '活动运营',
    items: [
      { path: '/events/tournaments', label: '赛事管理', icon: Trophy },
      { path: '/events/live', label: '观赛直播', icon: Video },
      { path: '/events/teams', label: '战队招募', icon: Users },
    ],
  },
  {
    group: '商城管理',
    items: [
      { path: '/mall/products', label: '商品管理', icon: ShoppingCart },
      { path: '/mall/orders', label: '订单履约', icon: Package },
    ],
  },
  {
    group: '系统设置',
    items: [
      { path: '/settings/stores', label: '门店管理', icon: Settings },
    ],
  },
];

// 临时导入缺失图标
import { Trophy, Video, Package } from 'lucide-react';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-dark-900 border-r border-cyber-800 transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-cyber-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-400 to-neon-purple flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-orbitron font-bold text-lg text-cyber-400">
              电竞运营
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-cyber-400 to-neon-purple flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {menuItems.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {!sidebarCollapsed && (
              <div className="px-4 mb-2">
                <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">
                  {group.group}
                </span>
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-cyber-600/30 to-transparent text-cyber-400 border-l-2 border-cyber-400'
                      : 'text-dark-400 hover:text-cyber-300 hover:bg-dark-800/50',
                    sidebarCollapsed && 'justify-center mx-1 px-2'
                  )
                }
              >
                <item.icon className={cn(
                  'w-5 h-5 shrink-0',
                  sidebarCollapsed && 'w-6 h-6'
                )} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-cyber-800 p-3">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-cyber-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-dark-400 truncate">{user.roleName}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-dark-400 hover:text-cyber-400 hover:bg-dark-800 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-dark-400 hover:text-neon-red hover:bg-dark-800 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
