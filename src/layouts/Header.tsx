import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  Building2,
  Shield,
  Menu,
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, login, logout } = useUserStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: '首页', path: '/' },
    { label: '社保服务', path: '/personal/social-insurance' },
    { label: '医保服务', path: '/personal/medical' },
    { label: '公积金', path: '/personal/housing-fund' },
    { label: '人事考试', path: '/personal/exam' },
    { label: '电子社保卡', path: '/personal/ecard' },
  ];

  const enterpriseNavItems = [
    { label: '企业首页', path: '/' },
    { label: '参保管理', path: '/enterprise/insurance' },
    { label: '失业金预审', path: '/enterprise/unemployment' },
    { label: '劳动关系', path: '/enterprise/contract' },
  ];

  const adminNavItems = [
    { label: '管理首页', path: '/admin/dashboard' },
    { label: '业务督办', path: '/admin/supervision' },
    { label: '认证中心', path: '/admin/auth-center' },
    { label: '政策管理', path: '/admin/policy' },
  ];

  const currentNavItems = userRole === 'enterprise' 
    ? enterpriseNavItems 
    : userRole === 'admin' 
    ? adminNavItems 
    : navItems;

  const searchResults = [
    { label: '社保服务', desc: '养老、失业、工伤保险查询', path: '/personal/social-insurance' },
    { label: '医保服务', desc: '医保账户、就医记录、报销进度', path: '/personal/medical' },
    { label: '公积金', desc: '缴存、贷款、提取业务', path: '/personal/housing-fund' },
    { label: '人事考试', desc: '考试报名、准考证、成绩查询', path: '/personal/exam' },
    { label: '电子社保卡', desc: '电子凭证、扫码支付、卡服务', path: '/personal/ecard' },
    { label: '后台管理', desc: '督办、认证、政策管理', path: '/admin/dashboard', role: 'admin' as const },
    { label: '业务督办', desc: '超时预警和办理进度跟踪', path: '/admin/supervision', role: 'admin' as const },
    { label: '认证中心', desc: '实名核验和材料审核', path: '/admin/auth-center', role: 'admin' as const },
    { label: '政策管理', desc: '政策发布、标签和有效期管理', path: '/admin/policy', role: 'admin' as const },
  ].filter((item) => {
    const keyword = searchKeyword.trim();
    if (!keyword) return false;
    return `${item.label}${item.desc}`.includes(keyword);
  }).slice(0, 5);

  const handleSearchNavigate = (result: { path: string; role?: 'admin' }) => {
    if (result.role === 'admin') {
      login('admin');
    }
    setSearchKeyword('');
    navigate(result.path);
  };

  const handleSearchSubmit = () => {
    if (searchResults[0]) {
      handleSearchNavigate(searchResults[0]);
      return;
    }
    if (searchKeyword.trim()) {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-600">省人社一体化平台</h1>
                <p className="text-xs text-neutral-400">Provincial HRSS Service Platform</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {currentNavItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-primary-500 bg-primary-50'
                        : 'text-neutral-500 hover:text-primary-500 hover:bg-primary-50/50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" />
                <input
                  type="text"
                  placeholder="搜索服务、政策..."
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearchSubmit();
                    }
                  }}
                  className="w-56 pl-9 pr-4 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded-full focus:outline-none focus:border-primary-300 focus:bg-white transition-all"
                />
                {searchKeyword.trim() && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-neutral-100 py-2 z-50">
                    {searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <button
                          key={result.path}
                          onClick={() => handleSearchNavigate(result)}
                          className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors"
                        >
                          <span className="block text-sm font-medium text-neutral-700">{result.label}</span>
                          <span className="block text-xs text-neutral-400 mt-0.5">{result.desc}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-neutral-400">
                        未找到匹配服务
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button className="relative p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 hover:bg-neutral-50 rounded-full transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-neutral-600">
                  {user?.name || '游客'}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-neutral-100 py-2 animate-fade-in">
                  <div className="px-4 py-3 border-b border-neutral-50">
                    <p className="text-sm font-medium text-neutral-600">{user?.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{user?.idCard?.substring(0, 6)}...{user?.idCard?.substring(14)}</p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => navigate(userRole === 'enterprise' ? '/enterprise/profile' : '/personal/profile')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      个人中心
                    </button>
                    <button
                      onClick={() => navigate('/messages')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      消息中心
                    </button>
                    <button
                      onClick={() => {
                        login('admin');
                        navigate('/admin/dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      后台管理
                    </button>
                    <button
                      onClick={() => {
                        if (userRole === 'personal') {
                          navigate('/enterprise/insurance');
                        } else if (userRole === 'enterprise') {
                          navigate('/admin/dashboard');
                        } else {
                          navigate('/');
                        }
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      切换身份
                    </button>
                  </div>
                  
                  <div className="border-t border-neutral-50 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-500 hover:bg-danger-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="lg:hidden py-3 border-t border-neutral-100 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {currentNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMobileMenu(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
