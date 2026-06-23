import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Gauge,
  Users,
  ScanLine,
  CreditCard,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Calculator,
  Clock,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { title: '总控仪表盘', path: '/', icon: Gauge },
  { title: '用户档案', path: '/profile', icon: Users },
  { title: '智能抄表', path: '/meter-reading', icon: ScanLine },
  { title: '缴费中心', path: '/payment', icon: CreditCard },
  { title: '报修工单', path: '/repair', icon: Wrench },
  { title: '巡检管理', path: '/inspection', icon: ClipboardCheck },
  { title: '安全预警', path: '/warning', icon: AlertTriangle },
  { title: 'GIS服务网点', path: '/gis', icon: MapPin },
  {
    title: '后台管理',
    path: '/admin',
    icon: Settings,
    children: [
      { title: '阶梯计价', path: '/admin/pricing', icon: Calculator },
      { title: '停气排程', path: '/admin/outage', icon: Clock },
      { title: '账单引擎', path: '/admin/billing', icon: FileText },
      { title: '指标报送', path: '/admin/reporting', icon: BarChart3 },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/admin']);

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isChildActive = (item: MenuItem) => {
    if (!item.children) return false;
    return item.children.some(
      (child) =>
        location.pathname === child.path ||
        location.pathname.startsWith(child.path + '/')
    );
  };

  const sidebarClasses = cn(
    'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
    'md:translate-x-0',
    collapsed ? 'md:w-20' : 'md:w-60',
    mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full w-60'
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700">
              <Flame className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold text-primary-700">
                  燃气管理
                </span>
                <span className="text-xs text-gray-500">智慧服务平台</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/') ||
                isChildActive(item);
              const isExpanded = expandedMenus.includes(item.path);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <li key={item.path}>
                  {hasChildren ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.path)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5 flex-shrink-0',
                            isActive
                              ? 'text-primary-600'
                              : 'text-gray-400 group-hover:text-gray-500'
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">
                              {item.title}
                            </span>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 transition-transform duration-200',
                                isExpanded ? 'rotate-180' : ''
                              )}
                            />
                          </>
                        )}
                      </button>
                      {!collapsed && isExpanded && (
                        <ul className="mt-1 space-y-1 pl-6">
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive =
                              location.pathname === child.path;
                            return (
                              <li key={child.path}>
                                <NavLink
                                  to={child.path}
                                  onClick={onMobileClose}
                                  className={({ isActive }) =>
                                    cn(
                                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                                      isChildActive || isActive
                                        ? 'bg-primary-100 text-primary-700 font-medium'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    )
                                  }
                                >
                                  <ChildIcon
                                    className={cn(
                                      'w-4 h-4',
                                      isChildActive
                                        ? 'text-primary-600'
                                        : 'text-gray-400'
                                    )}
                                  />
                                  <span>{child.title}</span>
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )
                      }
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5 flex-shrink-0',
                          location.pathname === item.path
                            ? 'text-primary-600'
                            : 'text-gray-400 group-hover:text-gray-500'
                        )}
                      />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && location.pathname === item.path && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-500" />
                      )}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden md:block p-3 border-t border-gray-100">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
            {!collapsed && <span>收起菜单</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
