import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileClock,
  Fingerprint,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: '督办仪表盘', path: '/admin/dashboard' },
    { icon: FileClock, label: '业务督办', path: '/admin/supervision' },
    { icon: Fingerprint, label: '认证中心', path: '/admin/auth-center' },
    { icon: FileText, label: '政策管理', path: '/admin/policy' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside
        className={`fixed left-0 top-0 h-screen bg-neutral-700 text-white transition-all duration-300 z-50 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-neutral-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold">管理后台</h1>
                <p className="text-[10px] text-neutral-400">Admin Console</p>
              </div>
            )}
          </div>
        </div>

        <nav className="py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-primary-500/20 border-r-2 border-primary-400'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-600/50'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        <header className="h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <h2 className="text-lg font-semibold text-neutral-600">
              {menuItems.find((m) => location.pathname.startsWith(m.path))?.label || '管理后台'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 hover:bg-neutral-50 rounded-full transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <span className="text-sm font-medium text-neutral-600">{user?.name || '管理员'}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-dropdown border border-neutral-100 py-2 animate-fade-in">
                  <button
                    onClick={() => {}}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    个人信息
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-500 hover:bg-danger-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
