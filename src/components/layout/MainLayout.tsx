import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Wallet,
  FileText,
  HeartPulse,
  Calendar,
  CreditCard,
  MapPin,
  Bell,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { maskIdCard } from '@/utils/format';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { path: '/home', label: '首页', icon: <Home className="w-5 h-5" /> },
  { path: '/account', label: '账户查询', icon: <Wallet className="w-5 h-5" /> },
  { path: '/medical', label: '就诊记录', icon: <FileText className="w-5 h-5" /> },
  { path: '/chronic', label: '慢特病认定', icon: <HeartPulse className="w-5 h-5" /> },
  { path: '/registration', label: '挂号预约', icon: <Calendar className="w-5 h-5" /> },
  { path: '/payment', label: '医保支付', icon: <CreditCard className="w-5 h-5" /> },
  { path: '/navigation', label: '医院导航', icon: <MapPin className="w-5 h-5" /> },
  { path: '/notification', label: '消息中心', icon: <Bell className="w-5 h-5" /> },
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { userInfo, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside
        className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-200 bg-gradient-to-r from-insurance-500 to-insurance-600">
          <div className="text-white font-bold">
            {collapsed ? (
              <span className="text-2xl">医</span>
            ) : (
              <span className="text-lg">江苏医保服务</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-insurance-50 text-insurance-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-insurance-500' : ''}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {!collapsed && userInfo && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-insurance-100 flex items-center justify-center text-insurance-600">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{userInfo.name}</p>
                  <p className="text-xs text-slate-500 truncate">{maskIdCard(userInfo.idCard)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                参保地：{userInfo.insuredArea}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-danger-600 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight
              className={`w-5 h-5 text-slate-500 transition-transform ${
                collapsed ? '' : 'rotate-180'
              }`}
            />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
            <button
              onClick={() => navigate('/notification')}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
