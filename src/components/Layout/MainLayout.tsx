import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MENU_ITEMS, USER_ROLE_MAP, hasPermission } from '../../utils/constants';
import * as Icons from 'lucide-react';
import { authApi } from '../../utils/api';

const iconMap: Record<string, any> = {
  Home: Icons.Home,
  Building2: Icons.Building2,
  PlusCircle: Icons.PlusCircle,
  FileSignature: Icons.FileSignature,
  KeyRound: Icons.KeyRound,
  ClipboardList: Icons.ClipboardList,
  TrendingUp: Icons.TrendingUp,
  Activity: Icons.Activity,
  Users: Icons.Users,
  Settings: Icons.Settings,
  Menu: Icons.Menu,
  X: Icons.X,
  ChevronDown: Icons.ChevronDown,
  LogOut: Icons.LogOut,
  Shield: Icons.Shield,
};

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const filteredMenu = useMemo(() => {
    if (!user) return [];
    return MENU_ITEMS
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          hasPermission(user.role, item.permission, item.roles)
        )
      }))
      .filter(group => group.items.length > 0);
  }, [user]);

  const currentPageName = useMemo(() => {
    const allItems = filteredMenu.flatMap(g => g.items);
    const matched = allItems.find(i => location.pathname.startsWith(i.path) && i.path !== '/') ||
                    allItems.find(i => i.path === '/');
    return matched?.name || '工作台首页';
  }, [filteredMenu, location.pathname]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (e) { /* ignore */ }
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} bg-primary-700 text-white flex flex-col transition-all duration-300 shrink-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-primary-600">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <Icons.Building2 className="w-8 h-8 text-accent-400" />
              <div>
                <div className="text-lg font-bold">居住服务平台</div>
                <div className="text-xs text-primary-200">租售装服一体化</div>
              </div>
            </div>
          ) : (
            <Icons.Building2 className="w-8 h-8 text-accent-400 mx-auto" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-primary-200 hover:text-white"
            title={collapsed ? '展开' : '收起'}
          >
            {collapsed ? <Icons.ChevronDown className="w-5 h-5 rotate-90" /> : <Icons.ChevronDown className="w-5 h-5 -rotate-90" />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredMenu.map((group, idx) => (
            <div key={idx} className="mb-4">
              {!collapsed && (
                <div className="px-4 mb-2 text-xs font-medium text-primary-300 uppercase tracking-wider">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] || Icons.Circle;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-accent-400'
                          : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                      }`
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Role badge */}
        {!collapsed && (
          <div className="p-3 border-t border-primary-600">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-600/50 rounded-lg">
              <Icons.Shield className="w-4 h-4 text-accent-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-primary-200">当前身份</div>
                <div className="text-sm font-medium text-white truncate">
                  {USER_ROLE_MAP[user.role] || user.role}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {currentPageName}
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-medium shadow">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{user?.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  {USER_ROLE_MAP[user?.role || ''] || user?.role}
                </div>
              </div>
              <Icons.ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-medium">
                        {user?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{user?.name}</div>
                        <div className="text-xs text-gray-500">{user?.phone}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium">
                        {USER_ROLE_MAP[user?.role || ''] || user?.role}
                      </span>
                      <span className="text-xs text-gray-400">ID: {user?.id}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <div className="px-4 py-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                      账号信息
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-600 flex justify-between">
                      <span>手机号</span>
                      <span className="font-medium text-gray-800">{user?.phone}</span>
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-600 flex justify-between">
                      <span>角色</span>
                      <span className="font-medium text-gray-800">
                        {USER_ROLE_MAP[user?.role || ''] || user?.role}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Icons.LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
