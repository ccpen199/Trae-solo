import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  Wallet,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  X,
  Shield,
  BarChart3,
  Gauge,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { messageApi } from '../../lib/api';
import { useEffect } from 'react';

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await messageApi.getUnreadCount();
        setUnreadCount(data.total);
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { path: '/', label: '工作台', icon: LayoutDashboard, roles: ['employer', 'provider', 'admin'] },
    { path: '/tasks', label: '需求任务', icon: Briefcase, roles: ['employer', 'provider', 'admin'] },
    { path: '/talents', label: '人才库', icon: Users, roles: ['employer', 'provider', 'admin'] },
    { path: '/messages', label: '消息中心', icon: MessageSquare, roles: ['employer', 'provider', 'admin'], badge: unreadCount },
    { path: '/finance', label: '财务中心', icon: Wallet, roles: ['employer', 'provider', 'admin'] },
    { type: 'divider', roles: ['admin'] },
    { path: '/admin/tasks', label: '任务看板', icon: BarChart3, roles: ['admin'] },
    { path: '/admin/talents', label: '服务商管理', icon: Shield, roles: ['admin'] },
    { path: '/admin/disputes', label: '争议仲裁', icon: AlertTriangle, roles: ['admin'] },
    { path: '/admin/audit', label: '合规审计', icon: FileCheck, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(
    (item) => 'type' in item || !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white flex flex-col transition-all duration-300`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">创意众包</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredItems.map((item, idx) => {
            if ('type' in item && item.type === 'divider') {
              return (
                <div key={idx} className="mx-4 my-2 border-t border-slate-700" />
              );
            }
            const Icon = item.icon!;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path!)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  isActive(item.path!)
                    ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-slate-400">
                    {user?.role === 'admin' ? '管理员' : user?.role === 'employer' ? '企业雇主' : '创意服务商'}
                  </p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                {userMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-40 bg-slate-800 rounded-lg shadow-xl overflow-hidden">
                    <button className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-2 text-sm">
                      <Settings className="w-4 h-4" /> 设置
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-2 text-sm text-red-400"
                    >
                      <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center font-bold">
                {user?.name?.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              {filteredItems.find((item) => !('type' in item) && isActive(item.path!))?.label || '工作台'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
