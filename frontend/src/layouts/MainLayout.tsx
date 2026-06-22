import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { USER_ROLE_LABELS, getInitials } from '../utils/constants';

export default function MainLayout() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/', label: '首页', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/diaries', label: '装修日记', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { path: '/designers', label: '找设计师', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/inspiration', label: '灵感图谱', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { path: '/transactions', label: '我的交易', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', requireAuth: true },
  ];

  const requireNav = navItems.filter(n => (n.requireAuth ? token : true));

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">装修之家</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {requireNav.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-3">
              <Link to="/diaries/create" className="hidden sm:inline-flex btn-accent !py-1.5 !px-4 text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                发布日记
              </Link>

              {token ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                        {getInitials(user?.nickname || user?.username)}
                      </div>
                    )}
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900">{user?.nickname || user?.username}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            <span className="badge bg-primary-50 text-primary-700">
                              {USER_ROLE_LABELS[user?.role || 'homeowner']}
                            </span>
                          </p>
                        </div>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">个人中心</Link>
                        <Link to="/transactions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">我的交易</Link>
                        {user?.role === 'designer' && (
                          <Link to="/designers/apply" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">设计师资料</Link>
                        )}
                        {user?.role !== 'designer' && (
                          <Link to="/designers/apply" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">申请成为设计师</Link>
                        )}
                        {user?.role === 'admin' && (
                          <Link to="/moderation" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">内容审核后台</Link>
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            退出登录
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/auth/login" className="btn-ghost !py-1.5 text-sm">登录</Link>
                  <Link to="/auth/register" className="btn-primary !py-1.5 !px-4 text-sm">注册</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-bold text-gray-900">装修之家</span>
              </div>
              <p className="text-sm text-gray-500">专业的装修UGC社区，连接业主与优秀设计师，全程交易托管保障。</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">业主服务</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/diaries" className="hover:text-primary-700">装修日记</Link></li>
                <li><Link to="/designers" className="hover:text-primary-700">寻找设计师</Link></li>
                <li><Link to="/inspiration" className="hover:text-primary-700">灵感图谱</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">设计师</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/designers/apply" className="hover:text-primary-700">入驻申请</Link></li>
                <li><Link to="/transactions" className="hover:text-primary-700">项目管理</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">平台保障</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>定金托管</li>
                <li>分阶段付款</li>
                <li>内容安全审核</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-6 text-center text-sm text-gray-500">
            © 2024 装修之家 UGC社区与设计师撮合平台 · All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
