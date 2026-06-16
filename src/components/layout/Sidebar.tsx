import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  HandPlatter,
  Bot,
  Users,
  CreditCard,
  ClipboardList,
  Settings,
  BarChart3,
  Lightbulb,
  ShieldAlert,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import type { MenuItem } from '../../shared/types';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  HandPlatter,
  Bot,
  Users,
  CreditCard,
  ClipboardList,
  Settings,
  BarChart3,
  Lightbulb,
  ShieldAlert,
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarCollapsed, menuItems, setCurrentPage, setBreadcrumbs } = useAppStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['admin']);

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const hasPermission = (item: MenuItem): boolean => {
    if (!item.roles || !user) return true;
    return item.roles.includes(user.userType);
  };

  const handleMenuClick = (item: MenuItem) => {
    setCurrentPage(item.key);
    if (item.label) {
      setBreadcrumbs([item.label]);
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasPermission(item)) return null;

    const Icon = iconMap[item.icon] || LayoutDashboard;
    const isActive = location.pathname === item.path;
    const isExpanded = expandedMenus.includes(item.key);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.key} className="mb-1">
          <button
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
              isExpanded
                ? 'bg-primary-50 text-primary-500'
                : 'text-gov-gray-500 hover:bg-gov-gray-50 hover:text-gov-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </div>
            {!sidebarCollapsed && (
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            )}
          </button>
          {isExpanded && !sidebarCollapsed && (
            <div className="mt-1 ml-4 pl-4 border-l-2 border-gov-gray-100 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.key}
        to={item.path || '#'}
        onClick={() => handleMenuClick(item)}
        className={({ isActive }) =>
          `sidebar-item ${isActive ? 'active' : ''} ${level > 0 ? 'py-2 text-sm' : ''}`
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={`h-[calc(100vh-64px)] bg-white border-r border-gov-gray-200 transition-all duration-300 sticky top-16 flex flex-col ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 py-4 px-3 overflow-y-auto scrollbar-hide">
        <nav className="space-y-1">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>

      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gov-gray-100">
          <div className="gov-card p-4 bg-gradient-to-br from-primary-50 to-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gov-gray-700">政务服务热线</p>
                <p className="text-2xl font-bold text-primary-500 mt-1">12345</p>
                <p className="text-xs text-gov-gray-400 mt-1">7x24小时服务</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
