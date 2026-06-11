import { Link, useLocation } from 'react-router-dom';
import { Cloud, MapPin, BarChart3, AlertTriangle, Settings, Home, History, UserCircle, Shield, Bell } from 'lucide-react';
import { useWeatherStore } from '../stores/weatherStore';
import { useState } from 'react';
import CitySearch from './CitySearch';

export default function Navbar() {
  const location = useLocation();
  const { currentCity } = useWeatherStore();
  const [showCitySearch, setShowCitySearch] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/forecast', label: '预报', icon: BarChart3 },
    { path: '/history', label: '历史', icon: History },
    { path: '/alerts', label: '预警', icon: AlertTriangle },
    { path: '/cities', label: '城市', icon: MapPin },
    { path: '/profile', label: '我的', icon: UserCircle },
  ];

  const adminNavItems = [
    { path: '/admin', label: '概览', icon: BarChart3 },
    { path: '/admin/quality', label: '数据质量', icon: Settings },
    { path: '/admin/circuit-breaker', label: '熔断管理', icon: AlertTriangle },
    { path: '/admin/index-config', label: '指数配置', icon: Settings },
    { path: '/admin/api', label: '接口管理', icon: Settings },
    { path: '/admin/compliance', label: '合规监控', icon: Shield },
    { path: '/admin/alerts', label: '预警管理', icon: Bell },
  ];

  const items = isAdminRoute ? adminNavItems : navItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">气象云图</span>
              <span className="text-slate-400 text-xs ml-2 hidden sm:inline">高精度融合平台</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {!isAdminRoute && (
              <button
                onClick={() => setShowCitySearch(!showCitySearch)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-sm transition-colors border border-slate-700/50"
              >
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">{currentCity?.name || '选择城市'}</span>
              </button>
            )}
            <Link
              to={isAdminRoute ? '/' : '/admin'}
              className="text-xs text-slate-400 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
            >
              {isAdminRoute ? '返回前台' : '管理后台'}
            </Link>
          </div>
        </div>
      </div>

      {showCitySearch && (
        <div className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
          <CitySearch onClose={() => setShowCitySearch(false)} />
        </div>
      )}
    </nav>
  );
}
