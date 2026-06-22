import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppStore } from '../store/appStore';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/match', label: '智能匹配', icon: '💫' },
  { path: '/activities', label: '组局活动', icon: '🎉' },
  { path: '/bubble', label: '泡泡房间', icon: '💬' },
  { path: '/safety', label: '平安哨', icon: '🛡️' },
  { path: '/chat', label: '消息', icon: '✉️' },
  { path: '/coupons', label: '小壶优选', icon: '🎫' },
];

function getScoreColor(score: number): string {
  if (score >= 750) return '#10b981';
  if (score >= 650) return '#6366f1';
  if (score >= 550) return '#f59e0b';
  return '#ef4444';
}

export default function Layout({ children }: { children?: ReactNode }) {
  const { currentUser } = useAppStore();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              锚
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">信用锚点</h1>
              <p className="text-xs text-gray-500">实名、安全、高质量社交</p>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {currentUser && (
            <NavLink to={`/profile/${currentUser.id}`} className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              <div className="credit-score-ring text-xs" style={{
                background: `conic-gradient(${getScoreColor(currentUser.creditScore)} ${(currentUser.creditScore / 900) * 360}deg, #e2e8f0 0)`,
                padding: '2px'
              }}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <span style={{ color: getScoreColor(currentUser.creditScore) }}>{currentUser.creditScore}</span>
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900">{currentUser.nickname}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {currentUser.verification?.verified && <span className="badge badge-success">已认证</span>}
                  {currentUser.riskLevel && currentUser.riskLevel !== 'low' && (
                    <span className={`badge ${currentUser.riskLevel === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                      {currentUser.riskLevel === 'high' ? '高风险' : '注意'}
                    </span>
                  )}
                </div>
              </div>
              <img src={currentUser.avatar} alt="" className="avatar avatar-sm" />
            </NavLink>
          )}
        </div>

        <nav className="md:hidden flex overflow-x-auto border-t border-gray-100 px-2 py-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'
                }`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        {children || <Outlet />}
      </main>
    </div>
  );
}
