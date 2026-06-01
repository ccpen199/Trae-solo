import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  RotateCcw,
  Clock,
  Scale,
  BarChart3,
  Settings,
  LogOut,
  User,
  Store,
  Menu,
  X,
  ChevronDown,
  Users,
  Shield,
  Building2,
  FileSearch,
  History,
  UserCog,
  Bell,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  roles?: string[];
  children?: MenuItem[];
}

interface UserMenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  roles?: string[];
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['admin']);
  const [pendingCount, setPendingCount] = useState(0);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const hasPermission = useAuthStore(state => state.hasPermission);
  const hasRole = useAuthStore(state => state.hasRole);
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    {
      path: '/',
      label: '首页',
      icon: <Home className="w-5 h-5" />,
    },
    {
      path: '/pos',
      label: '收银台',
      icon: <ShoppingCart className="w-5 h-5" />,
      permission: 'order:create',
      roles: ['cashier', 'store_manager', 'admin']
    },
    {
      path: '/orders',
      label: '订单管理',
      icon: <ShoppingCart className="w-5 h-5" />,
      permission: 'order:view'
    },
    {
      path: '/refunds',
      label: '退款管理',
      icon: <RotateCcw className="w-5 h-5" />,
      permission: 'refund:view'
    },
    {
      path: '/shifts',
      label: '交班管理',
      icon: <Clock className="w-5 h-5" />,
      permission: 'shift:view'
    },
    {
      path: '/reconciliation',
      label: '财务对账',
      icon: <Scale className="w-5 h-5" />,
      permission: 'reconciliation:view',
      roles: ['finance', 'admin', 'store_manager']
    },
    {
      path: '/reports',
      label: '数据报表',
      icon: <BarChart3 className="w-5 h-5" />,
      permission: 'report:view'
    },
    {
      path: '/admin',
      label: '系统管理',
      icon: <Settings className="w-5 h-5" />,
      roles: ['admin'],
      children: [
        {
          path: '/admin/users',
          label: '用户管理',
          icon: <Users className="w-4 h-4" />,
          roles: ['admin']
        },
        {
          path: '/admin/roles',
          label: '角色权限',
          icon: <Shield className="w-4 h-4" />,
          roles: ['admin']
        },
        {
          path: '/admin/stores',
          label: '门店管理',
          icon: <Building2 className="w-4 h-4" />,
          roles: ['admin']
        },
        {
          path: '/admin/products',
          label: '商品管理',
          icon: <ShoppingCart className="w-4 h-4" />,
          roles: ['admin', 'store_manager']
        },
        {
          path: '/admin/members',
          label: '会员管理',
          icon: <User className="w-4 h-4" />,
          roles: ['admin', 'store_manager']
        },
        {
          path: '/admin/audit',
          label: '操作审计',
          icon: <History className="w-4 h-4" />,
          roles: ['admin', 'finance']
        },
        {
          path: '/admin/review',
          label: '业务复查',
          icon: <FileSearch className="w-4 h-4" />,
          roles: ['admin', 'finance', 'store_manager']
        }
      ]
    }
  ];

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const checkMenuVisible = (item: MenuItem) => {
    if (item.roles && !hasRole(...item.roles)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  };

  const filteredMenu = menuItems.filter(checkMenuVisible);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuActions: UserMenuAction[] = [
    {
      label: '个人设置',
      icon: <UserCog className="w-4 h-4" />,
      onClick: () => {
        setUserMenuOpen(false);
        navigate('/admin/profile');
      }
    },
    {
      label: '待办事项',
      icon: <Bell className="w-4 h-4" />,
      onClick: () => {
        setUserMenuOpen(false);
        navigate('/');
      },
      roles: ['admin', 'finance', 'store_manager']
    },
    {
      label: '操作审计',
      icon: <History className="w-4 h-4" />,
      onClick: () => {
        setUserMenuOpen(false);
        navigate('/admin/audit');
      },
      roles: ['admin', 'finance']
    },
    {
      label: '退出登录',
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleLogout,
      danger: true
    }
  ];

  const filteredUserActions = userMenuActions.filter(
    action => !action.roles || hasRole(...action.roles)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '系统管理员',
      finance: '财务人员',
      store_manager: '门店店长',
      cashier: '收银员',
      area_operator: '区域运营'
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      finance: 'bg-blue-100 text-blue-700',
      store_manager: 'bg-green-100 text-green-700',
      cashier: 'bg-yellow-100 text-yellow-700',
      area_operator: 'bg-orange-100 text-orange-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.path);
    const visibleChildren = item.children?.filter(checkMenuVisible) || [];

    if (hasChildren && visibleChildren.length === 0) {
      return null;
    }

    return (
      <div key={item.path}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleMenu(item.path)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname.startsWith(item.path)
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              )}
            </button>
            {isExpanded && sidebarOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                {visibleChildren.map(child => renderMenuItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <NavLink
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              } ${depth > 0 ? 'text-sm' : ''}`
            }
          >
            {item.icon}
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold text-gray-800">收银对账系统</h1>
              <p className="text-xs text-gray-500 mt-0.5">门店日结 · 财务核对平台</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {sidebarOpen && user && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {user.real_name?.charAt(0) || user.username?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.real_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                {user.store_name && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    <Store className="w-3 h-3 inline mr-1" />
                    {user.store_name}
                  </p>
                )}
              </div>
              {pendingCount > 0 && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenu.map(item => renderMenuItem(item))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">工作台提示</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {hasRole('cashier') && '请先开始交班，再进行收银操作。交接班时请仔细核对实收金额。'}
                    {hasRole('store_manager') && '请及时审核退款申请和交班差异，确保日结完成。'}
                    {hasRole('finance') && '每日对账请标记长短款，异常订单需追踪原因。'}
                    {hasRole('admin') && '系统配置、角色权限、操作审计均在此管理。'}
                    {hasRole('area_operator') && '可查看区域内所有门店数据报表。'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <div className="relative user-menu">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">{user?.real_name}</p>
                  <p className="text-xs text-gray-500">
                    {getRoleLabel(user?.role || '')}
                  </p>
                </div>
              )}
              {sidebarOpen && (
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                {sidebarOpen && user && (
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="font-semibold text-gray-800">{user.real_name}</p>
                    <p className="text-sm text-gray-500">{user.username}</p>
                  </div>
                )}
                {filteredUserActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                      action.danger
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div>
            {user?.store_id && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Store className="w-4 h-4" />
                <span>{user.store_name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {(hasRole('admin', 'finance', 'store_manager') && pendingCount > 0) && (
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              </button>
            )}
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
