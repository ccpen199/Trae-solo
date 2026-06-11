import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  ShieldCheck,
  Home as HomeIcon,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { mockUser } from '@/data/mock';

const navItems = [
  { path: '/', label: '首页', icon: HomeIcon },
  { path: '/card', label: '社保卡服务', icon: CreditCard },
  { path: '/benefit', label: '权益单查询', icon: FileText },
  { path: '/unemployment', label: '失业金预检', icon: ShieldCheck },
];

export default function MainLayout() {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-gov-red via-red-700 to-red-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gov-red" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">河北省人社综合服务平台</h1>
              <p className="text-xs text-red-100">Hebei Human Resources & Social Security Services</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-white/10 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{mockUser.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{mockUser.name}</p>
                    <p className="text-xs text-gray-500">{mockUser.phone}</p>
                    <p className="text-xs text-gray-400 mt-1">{mockUser.cityName}</p>
                  </div>
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Building2 className="w-4 h-4" />
                    后台管理
                  </Link>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <ul className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 ${
                        isActive
                          ? 'border-white text-white bg-white/10'
                          : 'border-transparent text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-gray-300 text-sm py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>主办单位：河北省人力资源和社会保障厅</p>
          <p className="text-gray-500 text-xs mt-2">
            服务热线：12333 · 技术支持：河北省人社信息中心 · © 2024 版权所有
          </p>
        </div>
      </footer>
    </div>
  );
}
