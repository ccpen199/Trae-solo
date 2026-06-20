import { Link, useLocation } from 'react-router-dom';
import { Video, MapPin, Briefcase, User, Building2, Search, Shield } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '发现', icon: Video },
    { path: '/jobs', label: '岗位', icon: Briefcase },
    { path: '/map', label: '地图', icon: MapPin },
    { path: '/companies', label: '企业', icon: Building2 },
    { path: '/seekers', label: '人才', icon: User },
    { path: '/search', label: '搜索', icon: Search },
    { path: '/enterprise', label: '企业版', icon: Building2 },
    { path: '/admin', label: '管理后台', icon: Shield },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            职影
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.slice(0, 6).map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/enterprise"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            企业版
          </Link>
          <Link
            to="/admin"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Shield className="w-4 h-4" />
            管理
          </Link>
          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
            我
          </button>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-around border-t border-gray-100 h-14 bg-white">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
