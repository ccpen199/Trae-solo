import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { ROLE_LABELS, ROLE_COLORS, VERIFICATION_STATUS } from '../../lib/constants';
import { useEffect, useState } from 'react';

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  const { user, enterprise, logout, unreadCount, fetchUnreadCount } = useAuthStore();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    fetchUnreadCount();
    const t = setInterval(fetchUnreadCount, 60000);
    setActive(location.pathname);
    return () => clearInterval(t);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isCarrier = user?.role === 'carrier';
  const isInspector = user?.role === 'inspector';

  const nav = [
    { to: '/', label: '工作台', icon: '📊', roles: ['*'] },
    { to: '/opportunities', label: '商机市场', icon: '🎯', roles: ['*'] },
    { to: '/opportunities/publish', label: '发布商机', icon: '➕', roles: ['recycler', 'producer', 'admin'] },
    { to: '/subscriptions', label: '商机订阅', icon: '🔔', roles: ['*'] },
    { to: '/negotiations', label: '议价中心', icon: '💬', roles: ['recycler', 'producer', 'admin'] },
    { to: '/contracts', label: '电子合同', icon: '📄', roles: ['recycler', 'producer', 'admin'] },
    { to: '/orders', label: '交易订单', icon: '📦', roles: ['*'] },
    { to: '/logistics', label: '物流调度', icon: '🚛', roles: ['recycler', 'producer', 'carrier', 'admin'] },
    { to: '/trace-codes', label: '溯源码管理', icon: '🏷️', roles: ['*'] },
    { to: '/trace-verify', label: '溯源查询', icon: '🔍', roles: ['*'] },
    { to: '/credit-ratings', label: '信用评级', icon: '⭐', roles: ['*'] },
    { to: '/heatmap', label: '区域供需热力图', icon: '🗺️', roles: ['*'] },
    { to: '/price-forecast', label: '价格走势预测', icon: '📈', roles: ['*'] },
    { to: '/carrier/orders', label: '承运任务', icon: '🚚', roles: ['carrier'] },
    { to: '/admin/enterprises', label: '企业审核', icon: '✅', roles: ['admin'] },
  ];

  const filteredNav = nav.filter(n => n.roles.includes('*') || (user && n.roles.includes(user.role)));

  const mainNav = filteredNav.filter(n => !['/carrier/orders', '/admin/enterprises', '/logistics'].includes(n.to));
  const adminNav = filteredNav.filter(n => ['/admin/enterprises'].includes(n.to));

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-30">
        <Link to="/" className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl">
            ♻️
          </div>
          <div>
            <div className="font-bold text-lg text-slate-800">绿循环</div>
            <div className="text-xs text-slate-500">再生资源B2B平台</div>
          </div>
        </Link>

        {user && (
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800 truncate">{user.username}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  {enterprise && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${VERIFICATION_STATUS[enterprise.verification_status]?.color}`}>
                      {VERIFICATION_STATUS[enterprise.verification_status]?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {enterprise && (
              <div className="mt-2 text-xs text-slate-600 truncate" title={enterprise.company_name}>
                {enterprise.company_name}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">业务中心</div>
          {mainNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-0.5 transition-all
                ${isActive || location.pathname.startsWith(item.to) && item.to !== '/'
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </NavLink>
          ))}

          {adminNav.length > 0 && (
            <>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-4">管理后台</div>
              {adminNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-0.5 transition-all
                    ${isActive ? 'bg-slate-800 text-white font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex gap-2">
            <Link
              to="/enterprise-cert"
              className="flex-1 text-center text-xs py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
            >
              企业中心
            </Link>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex-1 text-center text-xs py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {filteredNav.find(n => n.to === location.pathname || (n.to !== '/' && location.pathname.startsWith(n.to)))?.label || '工作台'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition">
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/enterprise-cert" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-700">{user?.username}</div>
                <div className="text-[10px] text-slate-500">{ROLE_LABELS[user?.role || '']}</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
