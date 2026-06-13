import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  MapPin,
  ShieldAlert,
  LayoutDashboard,
  Truck,
  User,
  LogOut,
  Flame,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: '首页', icon: Truck, end: true },
    { to: '/order', label: '我要寄件', icon: Package },
    { to: '/track', label: '物流查询', icon: Search },
    { to: '/outlets', label: '网点查询', icon: MapPin },
    { to: '/after-sale', label: '售后服务', icon: ShieldAlert },
  ];

  const adminItems = [
    { to: '/admin', label: '数据概览', icon: LayoutDashboard },
    { to: '/admin/heatmap', label: '效能热力图', icon: Flame },
    { to: '/admin/clv', label: 'CLV 分析', icon: BarChart3 },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 no-print">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-neutral-700 leading-tight">中通快递</div>
              <div className="text-[10px] text-neutral-400 leading-tight">ZTO EXPRESS</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-brand-50 text-brand-500' : 'text-neutral-500 hover:text-brand-500 hover:bg-brand-50/50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <div className="w-px h-6 bg-neutral-200 mx-2" />
            )}
            {isAdmin &&
              adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-accent-500 text-white' : 'text-neutral-500 hover:text-accent-500 hover:bg-orange-50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-500" />
                </div>
                <span className="hidden md:inline text-sm font-medium text-neutral-600">{user.nickname}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="btn-ghost !p-2"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-secondary !px-4 !py-2 text-sm">
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-neutral-700 text-neutral-300 text-sm no-print">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-white font-bold text-base mb-3">中通快递</div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                统一业务中枢系统，为您提供便捷、高效、安全的快递服务体验。
              </p>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">服务支持</div>
              <ul className="space-y-2 text-xs">
                <li>客服热线：95311</li>
                <li>服务时间：7×24小时</li>
                <li>投诉建议</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">快速链接</div>
              <ul className="space-y-2 text-xs">
                <li><Link to="/track" className="hover:text-white">物流查询</Link></li>
                <li><Link to="/outlets" className="hover:text-white">网点查询</Link></li>
                <li><Link to="/after-sale" className="hover:text-white">售后服务</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">关注我们</div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-600 flex items-center justify-center">微信</div>
                <div className="w-10 h-10 rounded-lg bg-neutral-600 flex items-center justify-center">微博</div>
                <div className="w-10 h-10 rounded-lg bg-neutral-600 flex items-center justify-center">APP</div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-neutral-600 text-center text-xs text-neutral-400">
            © 2026 中通快递统一业务中枢系统 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
