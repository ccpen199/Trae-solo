import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, Building2, MapPin, Phone, Search, Bell,
  Menu, X, ChevronDown, Shield, UserCircle, LogOut
} from 'lucide-react';

const navItems = [
  { path: '/', label: '门户首页', icon: LayoutDashboard },
  { path: '/personal', label: '个人数字空间', icon: User },
  { path: '/enterprise', label: '企业服务台', icon: Building2 },
  { path: '/life', label: '城市生活圈', icon: MapPin },
  { path: '/governance', label: '基层治理驾驶舱', icon: Shield },
];

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gov-600 to-gov-800 flex items-center justify-center text-white shadow-md">
                <span className="font-bold text-lg">厦</span>
              </div>
              <div className="hidden sm:block leading-tight">
                <h1 className="text-lg font-semibold text-gray-900">厦门市民数字服务中枢</h1>
                <p className="text-xs text-gray-500">政务服务 · 一站直达</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-gov-50 text-gov-700 shadow-sm'
                        : 'text-gray-600 hover:text-gov-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className={`relative hidden md:block transition-all duration-300 ${searchFocus ? 'w-72' : 'w-56'}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索服务、政策、办事指南…"
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-transparent focus:border-gov-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-100 text-sm transition-all duration-200"
              />
            </div>

            <button className="relative p-2 rounded-lg text-gray-500 hover:text-gov-700 hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse-slow" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gov-400 to-gov-600 flex items-center justify-center text-white text-sm font-medium">
                  陈
                </div>
                <span className="hidden sm:inline text-sm text-gray-700 font-medium">陈先生</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-100 shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-sm font-semibold text-gray-900">陈先生</p>
                    <p className="text-xs text-gray-500 mt-0.5">已实名 | 闽政通认证</p>
                  </div>
                  <Link to="/personal" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <UserCircle className="w-4 h-4 text-gray-400" />个人中心
                  </Link>
                  <Link to="/personal#credentials" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Shield className="w-4 h-4 text-gray-400" />我的证照
                  </Link>
                  <div className="my-1 border-t border-gray-50" />
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" />退出登录
                  </button>
                </div>
              )}
            </div>

            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden py-3 border-t border-gray-100 space-y-1 animate-fade-in">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-gov-50 text-gov-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="px-4 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索服务、政策…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-gov-300 focus:outline-none text-sm"
                />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
