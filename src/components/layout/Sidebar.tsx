import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingBag, Store, 
  Shield, BookOpen, BarChart3, Settings, LogOut,
  QrCode, UserPlus, Share2, Package, ClipboardList,
  FileCheck, MapPin, AlertTriangle, Award, Network,
  TrendingUp, PieChart
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import type { UserRole } from '../../../shared/types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuConfig: Record<UserRole, Array<{ group: string; items: Array<{ path: string; label: string; icon: React.ElementType }> }>> = {
  sales: [
    {
      group: '工作台',
      items: [
        { path: '/', label: '仪表盘', icon: LayoutDashboard },
      ]
    },
    {
      group: '展业中心',
      items: [
        { path: '/people/qrcode', label: '我的二维码', icon: QrCode },
        { path: '/people/customers', label: '客户管理', icon: UserPlus },
        { path: '/people/share', label: '分享传播', icon: Share2 },
      ]
    },
    {
      group: '业务管理',
      items: [
        { path: '/goods/products', label: '产品中心', icon: ShoppingBag },
        { path: '/field/appointments', label: '预约管理', icon: Calendar },
        { path: '/training/courses', label: '学习中心', icon: BookOpen },
        { path: '/training/exam', label: '在线考试', icon: FileCheck },
        { path: '/training/ranking', label: '业绩排行', icon: Award },
      ]
    },
    {
      group: '系统',
      items: [
        { path: '/profile', label: '个人中心', icon: Users },
        { path: '/settings', label: '设置', icon: Settings },
      ]
    }
  ],
  store_owner: [
    {
      group: '工作台',
      items: [
        { path: '/', label: '仪表盘', icon: LayoutDashboard },
      ]
    },
    {
      group: '门店管理',
      items: [
        { path: '/field/appointments', label: '预约管理', icon: Calendar },
        { path: '/field/services', label: '服务记录', icon: ClipboardList },
        { path: '/field/reviews', label: '客户评价', icon: MessageSquare },
        { path: '/goods/inventory', label: '库存管理', icon: Package },
      ]
    },
    {
      group: '业务中心',
      items: [
        { path: '/goods/products', label: '产品中心', icon: ShoppingBag },
        { path: '/training/courses', label: '学习中心', icon: BookOpen },
        { path: '/training/ranking', label: '业绩排行', icon: Award },
      ]
    },
    {
      group: '系统',
      items: [
        { path: '/profile', label: '个人中心', icon: Users },
        { path: '/settings', label: '设置', icon: Settings },
      ]
    }
  ],
  operator: [
    {
      group: '工作台',
      items: [
        { path: '/', label: '仪表盘', icon: LayoutDashboard },
      ]
    },
    {
      group: '人效管理',
      items: [
        { path: '/people/customers', label: '客户管理', icon: UserPlus },
      ]
    },
    {
      group: '货流管理',
      items: [
        { path: '/goods/products', label: '产品中心', icon: ShoppingBag },
        { path: '/goods/inventory', label: '库存管理', icon: Package },
        { path: '/goods/promotion', label: '促销活动', icon: Tag },
      ]
    },
    {
      group: '场景管理',
      items: [
        { path: '/field/stores', label: '生活馆管理', icon: Store },
        { path: '/field/appointments', label: '预约管理', icon: Calendar },
        { path: '/field/reviews', label: '评价管理', icon: MessageSquare },
      ]
    },
    {
      group: '合规风控',
      items: [
        { path: '/compliance/monitor', label: '风控监控', icon: Shield },
        { path: '/compliance/speech', label: '话术审核', icon: FileCheck },
        { path: '/compliance/withdraw', label: '提现审核', icon: Wallet },
        { path: '/compliance/geofence', label: '地理围栏', icon: MapPin },
      ]
    },
    {
      group: '培训管理',
      items: [
        { path: '/training/courses', label: '课件管理', icon: BookOpen },
        { path: '/training/exam', label: '考试管理', icon: FileCheck },
        { path: '/training/ranking', label: '业绩排行', icon: Award },
      ]
    },
    {
      group: '数据看板',
      items: [
        { path: '/analytics/team', label: '团队裂变', icon: Network },
        { path: '/analytics/sales', label: '动销分析', icon: TrendingUp },
        { path: '/analytics/market', label: '市场预警', icon: PieChart },
      ]
    },
    {
      group: '系统',
      items: [
        { path: '/profile', label: '个人中心', icon: Users },
        { path: '/settings', label: '设置', icon: Settings },
      ]
    }
  ],
  admin: [
    {
      group: '工作台',
      items: [
        { path: '/', label: '仪表盘', icon: LayoutDashboard },
      ]
    },
    {
      group: '人效管理',
      items: [
        { path: '/people/customers', label: '客户管理', icon: UserPlus },
      ]
    },
    {
      group: '货流管理',
      items: [
        { path: '/goods/products', label: '产品中心', icon: ShoppingBag },
        { path: '/goods/inventory', label: '库存管理', icon: Package },
        { path: '/goods/promotion', label: '促销活动', icon: Tag },
      ]
    },
    {
      group: '场景管理',
      items: [
        { path: '/field/stores', label: '生活馆管理', icon: Store },
      ]
    },
    {
      group: '合规风控',
      items: [
        { path: '/compliance/monitor', label: '风控监控', icon: Shield },
        { path: '/compliance/speech', label: '话术审核', icon: FileCheck },
        { path: '/compliance/withdraw', label: '提现审核', icon: Wallet },
        { path: '/compliance/geofence', label: '地理围栏', icon: MapPin },
      ]
    },
    {
      group: '培训管理',
      items: [
        { path: '/training/courses', label: '课件管理', icon: BookOpen },
      ]
    },
    {
      group: '数据看板',
      items: [
        { path: '/analytics/team', label: '团队裂变', icon: Network },
        { path: '/analytics/sales', label: '动销分析', icon: TrendingUp },
        { path: '/analytics/market', label: '市场预警', icon: PieChart },
      ]
    },
    {
      group: '系统',
      items: [
        { path: '/profile', label: '个人中心', icon: Users },
        { path: '/settings', label: '设置', icon: Settings },
      ]
    }
  ]
};

function Calendar(props: { className?: string }) {
  return <div {...props}>📅</div>;
}

function MessageSquare(props: { className?: string }) {
  return <div {...props}>💬</div>;
}

function Tag(props: { className?: string }) {
  return <div {...props}>🏷️</div>;
}

function Wallet(props: { className?: string }) {
  return <div {...props}>💳</div>;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const roleMenu = user ? menuConfig[user.role] : menuConfig.sales;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">新</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">新时代健康</h1>
              <p className="text-xs text-gray-500">展业协同平台</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">新</span>
            </div>
          </div>
        )}
        <button 
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
        {roleMenu.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-4">
            {!collapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.group}
              </h3>
            )}
            {group.items.map((item, itemIdx) => (
              <NavLink
                key={itemIdx}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? '退出登录' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
