import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Plus, LogOut, Trophy, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchKeyword)}`);
      setSearchKeyword('');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">虎</span>
            </div>
            <span className="text-xl font-bold text-secondary hidden sm:block">虎扑体育</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索帖子、用户..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </form>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/post/create')}
                  className="hidden sm:flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>发帖</span>
                </button>

                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Trophy className="w-4 h-4" />
                    <span>{user.level}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Coins className="w-4 h-4" />
                    <span>{user.coins}</span>
                  </div>
                </div>

                <div className="relative group">
                  <button className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user.nickname || user.username}</span>
                  </button>

                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="py-2">
                      <Link
                        to={`/user/${user.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        个人主页
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm bg-primary text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
