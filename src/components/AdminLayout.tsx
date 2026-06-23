import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, BookOpen, BarChart3 } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminInfo = localStorage.getItem('admin_info');
    if (!token || !adminInfo) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const navItems = [
    { path: '/admin/standards', icon: BookOpen, label: '标准包管理' },
    { path: '/admin/pdf', icon: FileText, label: 'PDF管理' },
    { path: '/dashboard', icon: BarChart3, label: '数据看板' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!admin && !localStorage.getItem('admin_token')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-950 border-r border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-xl">
              ♻️
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-white font-bold">管理后台</h1>
                <p className="text-xs text-gray-400">垃圾分类系统</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && admin && (
            <div className="mb-4 px-4">
              <p className="text-white font-medium">{admin.username}</p>
              <p className="text-xs text-gray-400">
                {admin.role === 'municipal_admin' ? '市政管理员' : '区级管理员'}
              </p>
              {admin.district && (
                <p className="text-xs text-green-400 mt-1">{admin.district}</p>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">退出登录</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              {admin?.district || '管理后台'}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
