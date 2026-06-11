import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Calculator,
  Wallet,
  MapPin,
  User,
  Settings,
  LogOut,
  Shield,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Navbar() {
  const { etcCard, isAdminView, setIsAdminView } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: '首页', icon: LayoutDashboard },
    { path: '/traffic', label: '通行记录', icon: Car },
    { path: '/toll-calculator', label: '路费查询', icon: Calculator },
    { path: '/recharge', label: '充值中心', icon: Wallet },
    { path: '/outlets', label: '网点服务', icon: MapPin },
  ];

  const handleToggleAdmin = () => {
    setIsAdminView(!isAdminView);
    if (!isAdminView) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const showLowBalanceWarning = etcCard.balance < 100 && etcCard.type === '储值卡';

  return (
    <nav className="bg-white shadow-sm border-b border-dark-200 sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-dark-800">粤通卡服务</h1>
                <p className="text-xs text-dark-500">省级交通缴费数字中台</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-600 hover:bg-primary-50 hover:text-primary-600'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showLowBalanceWarning && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-50 rounded-lg animate-pulse-slow">
                <Bell className="w-4 h-4 text-accent-500" />
                <span className="text-xs text-accent-600 font-medium">
                  余额不足 ¥{etcCard.balance.toFixed(2)}
                </span>
              </div>
            )}

            <button
              onClick={handleToggleAdmin}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-dark-100"
            >
              <Settings className="w-4 h-4" />
              <span>{isAdminView ? '用户端' : '管理后台'}</span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-dark-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-dark-800">{etcCard.type}</p>
                <p className="text-xs text-dark-500">¥{etcCard.balance.toFixed(2)}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center cursor-pointer hover:shadow-glow transition-all duration-300">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-dark-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-dark-200 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-600 hover:bg-primary-50 hover:text-primary-600'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleToggleAdmin}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-dark-600 hover:bg-dark-100 transition-all duration-200"
              >
                <Settings className="w-5 h-5" />
                {isAdminView ? '切换到用户端' : '切换到管理后台'}
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-dark-600 hover:bg-dark-100 transition-all duration-200">
                <LogOut className="w-5 h-5" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
