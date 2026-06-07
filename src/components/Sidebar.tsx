import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileText,
  MessageSquare,
  Store,
  ShoppingBag,
  Thermometer,
  CreditCard,
  KeyRound,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/store/authStore';

interface SidebarProps {
  role: UserRole;
}

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { path: '/', label: '首页仪表盘', icon: LayoutDashboard, roles: ['admin', 'property', 'resident', 'merchant'] },
  { path: '/dashboard/resident', label: '个人中心', icon: LayoutDashboard, roles: ['admin', 'property', 'resident', 'merchant'] },
  { path: '/buildings', label: '楼栋管理', icon: Building2, roles: ['admin', 'property'] },
  { path: '/tickets', label: '工单管理', icon: FileText, roles: ['admin', 'property', 'resident'] },
  { path: '/tickets/create', label: '创建工单', icon: FileText, roles: ['resident'] },
  { path: '/community', label: '邻里社区', icon: MessageSquare, roles: ['admin', 'property', 'resident'] },
  { path: '/posts/create', label: '发布帖子', icon: MessageSquare, roles: ['resident'] },
  { path: '/merchants', label: '商户广场', icon: Store, roles: ['admin', 'property', 'resident', 'merchant'] },
  { path: '/marketplace', label: '闲置集市', icon: ShoppingBag, roles: ['admin', 'property', 'resident', 'merchant'] },
  { path: '/items/create', label: '发布闲置', icon: ShoppingBag, roles: ['resident'] },
  { path: '/metrics', label: '社区温度', icon: Thermometer, roles: ['admin', 'property'] },
  { path: '/fees', label: '费用中心', icon: CreditCard, roles: ['admin', 'property', 'resident'] },
  { path: '/access', label: '门禁管理', icon: KeyRound, roles: ['admin', 'property'] },
];

const roleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  property: '物业管理员',
  resident: '小区居民',
  merchant: '入驻商家',
};

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
            社
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 font-serif">智慧社区</h1>
            <p className="text-xs text-gray-500">Smart Community</p>
          </div>
        </div>
        <div className="mt-4 px-3 py-2 bg-primary-50 rounded-lg">
          <p className="text-xs text-primary-600 font-medium">当前身份：{roleLabels[role]}</p>
        </div>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-4 mb-3">功能菜单</p>
        <div className="space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="text-center text-xs text-gray-400">
          <p>智慧社区管理系统 v1.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
