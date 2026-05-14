import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, LogOut, Plus, ChevronDown, Settings, Home, FileText, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getUnreadCount } from '../api/notifications';
import Avatar from './Avatar';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      getUnreadCount()
        .then((res) => {
          if (res?.success) {
            setUnreadCount(res.data.count);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClick = () => {
      setShowUserMenu(false);
      setShowCreateMenu(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">💼</span>
              <span className="text-xl font-bold text-blue-600">PMCAFF</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home size={18} />
                首页
              </Link>
              <Link
                to="/articles"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  location.pathname === '/articles' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={18} />
                文章
              </Link>
              <Link
                to="/questions"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  location.pathname === '/questions' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare size={18} />
                问答
              </Link>
            </nav>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章、问题、用户..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setShowCreateMenu(!showCreateMenu);
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus size={18} />
                    发布
                    <ChevronDown size={16} />
                  </button>
                  {showCreateMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <Link
                        to="/create/article"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText size={18} />
                        写文章
                      </Link>
                      <Link
                        to="/create/question"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <MessageSquare size={18} />
                        提问题
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  to="/notifications"
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowCreateMenu(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Avatar src={user.avatar} alt={user.nickname} size="sm" />
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.nickname || user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to={`/user/${user.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={18} />
                        个人主页
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings size={18} />
                        设置
                      </Link>
                      {['admin', 'moderator', 'editor'].includes(user.role) && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings size={18} />
                          后台管理
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
                        >
                          <LogOut size={18} />
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
