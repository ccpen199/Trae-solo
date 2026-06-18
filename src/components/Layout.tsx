import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  User,
  Building2,
  MapPin,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', icon: Home, label: '首页', roles: ['personal', 'enterprise', 'government'] },
  { path: '/personal', icon: User, label: '个人数字空间', roles: ['personal'] },
  { path: '/enterprise', icon: Building2, label: '企业服务台', roles: ['enterprise'] },
  { path: '/city', icon: MapPin, label: '城市生活圈', roles: ['personal', 'enterprise', 'government'] },
  { path: '/governance', icon: LayoutDashboard, label: '基层治理驾驶舱', roles: ['government'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(
    (item) => !user?.idType || item.roles.includes(user.idType)
  );

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-r border-gray-200 flex flex-col overflow-hidden"
          >
            <div className="h-16 flex items-center px-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="font-bold text-gray-900 text-sm">厦门市民</h1>
                <p className="text-xs text-gray-500">一站式数字服务中枢</p>
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-white font-bold">
                  {user?.realName?.[0] || '用'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.realName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.idType === 'personal' ? '个人用户' : user?.idType === 'enterprise' ? '企业用户' : '基层治理人员'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>

          <div className="ml-4 flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredNavItems.find((item) => 
                location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path))
              )?.label || '首页'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                等保三级
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
