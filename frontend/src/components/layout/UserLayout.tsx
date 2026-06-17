import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  Plus,
  User,
  LayoutGrid,
  Zap,
  Store,
  Shield,
  Bell,
  LogOut,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types';

const roleConfig: Array<{ role: UserRole; label: string; desc: string; icon: React.FC<{ className?: string }>; path: string }> = [
  { role: 'user', label: '用户端', desc: '下单·追踪', icon: User, path: '/' },
  { role: 'rider', label: '骑手端', desc: '接单·配送', icon: Zap, path: '/rider' },
  { role: 'merchant', label: '商户端', desc: '店铺·订单', icon: Store, path: '/merchant' },
  { role: 'admin', label: '运营端', desc: '看板·干预', icon: Shield, path: '/admin' },
];

export default function UserLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const currentRole = user?.role ?? 'user';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = (path: string, role: UserRole) => {
    if (role !== currentRole) {
      setShowRoleModal(false);
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[480px] min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">闪跑</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
              </button>
              <button onClick={() => setShowRoleModal(true)} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="切换角色">
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                </div>
              </button>
              <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="退出登录">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-24">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 pb-safe-area-inset-bottom z-30">
          <div className="relative flex items-center justify-around h-16 px-2">
            <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl transition-colors ${isActive ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <Home className="w-5 h-5" />
              <span className="text-xs font-medium">首页</span>
            </NavLink>

            <NavLink to="/orders" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl transition-colors ${isActive ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <ClipboardList className="w-5 h-5" />
              <span className="text-xs font-medium">订单</span>
            </NavLink>

            <div className="flex flex-col items-center justify-center">
              <NavLink to="/order/create" className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/40 flex items-center justify-center text-white hover:scale-105 transition-transform -mt-6">
                <Plus className="w-7 h-7" />
              </NavLink>
            </div>

            <button onClick={() => setShowRoleModal(true)} className="flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
              <LayoutGrid className="w-5 h-5" />
              <span className="text-xs font-medium">角色</span>
            </button>

            <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl transition-colors ${isActive ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <User className="w-5 h-5" />
              <span className="text-xs font-medium">我的</span>
            </NavLink>
          </div>
        </nav>

        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowRoleModal(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-full max-w-[480px] bg-white rounded-t-2xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">切换工作台</h3>
                <button onClick={() => setShowRoleModal(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {roleConfig.map((rc) => {
                  const RoleIcon = rc.icon;
                  const isCurrent = rc.role === currentRole;
                  return (
                    <button key={rc.role} onClick={() => handleRoleSwitch(rc.path, rc.role)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isCurrent ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCurrent ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={`font-medium text-sm ${isCurrent ? 'text-brand-600' : 'text-gray-800'}`}>{rc.label}</div>
                        <div className="text-xs text-gray-400">{rc.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 text-center text-sm text-gray-400">
                当前：<span className="text-brand-500 font-medium">{roleConfig.find((r) => r.role === currentRole)?.label}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
