import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/admin/audit', label: '内容审核', icon: '🔍', desc: 'AI初筛 + 人工复审' },
    { path: '/admin/governance', label: '治理驾驶舱', icon: '📊', desc: '热点聚类 + 风险预警' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-lg">
              管
            </div>
            <div>
              <div className="font-bold">邻里圈管理</div>
              <div className="text-xs text-slate-400">Community Admin</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-primary-600/20 to-primary-600/10 text-white border border-primary-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold">
              {user?.nickname?.[0]}
            </div>
            <div>
              <div className="text-sm font-medium">{user?.nickname}</div>
              <div className="text-xs text-slate-400">
                {user?.role === 'ADMIN' ? '超级管理员' : '政府账号'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              返回前台
            </button>
            <button
              onClick={logout}
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
