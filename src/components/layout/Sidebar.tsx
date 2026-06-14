import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  KeyRound,
  FileText,
  ShoppingBag,
  Users,
  BarChart3,
  Store,
  AlertTriangle,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore, useAppStore } from '@/store';
import type { UserRole } from '@shared/types';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '工作台', icon: Home, roles: ['owner', 'tenant', 'property', 'merchant'] },
  { path: '/access', label: '通行管理', icon: KeyRound, roles: ['owner', 'tenant', 'property'] },
  { path: '/workorder', label: '工单中心', icon: FileText, roles: ['owner', 'tenant', 'property'] },
  { path: '/mall', label: '社区商圈', icon: ShoppingBag, roles: ['owner', 'tenant', 'visitor'] },
  { path: '/social', label: '邻里社交', icon: Users, roles: ['owner', 'tenant'] },
  { path: '/property/dashboard', label: '物业驾驶舱', icon: BarChart3, roles: ['property'] },
  { path: '/merchant/dashboard', label: '商户后台', icon: Store, roles: ['merchant'] },
  { path: '/risk', label: '风险预警', icon: AlertTriangle, roles: ['property'] },
  { path: '/profile', label: '个人中心', icon: User, roles: ['owner', 'tenant', 'property', 'merchant'] },
];

const roleNames: Record<UserRole, string> = {
  owner: '业主',
  tenant: '租户',
  visitor: '访客',
  property: '物业员工',
  merchant: '商户',
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const filteredMenuItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">智慧社区</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {user && !sidebarCollapsed && (
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.name}
              className="w-10 h-10 rounded-full bg-blue-600"
            />
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-blue-300">{roleNames[user.role]}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="p-2 flex-1 overflow-y-auto">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              } ${sidebarCollapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-red-300 hover:bg-blue-700 hover:text-red-400 transition-colors ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!sidebarCollapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
