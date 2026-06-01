import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Compass, Users, User, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Compass className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-800">旅行僧</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-1 text-gray-600 hover:text-primary-500 transition-colors">
                <Home className="h-5 w-5" />
                <span>首页</span>
              </Link>
              <Link to="/travel-bar" className="flex items-center space-x-1 text-gray-600 hover:text-primary-500 transition-colors">
                <Users className="h-5 w-5" />
                <span>旅吧</span>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/create-guide"
                    className="btn-primary flex items-center space-x-1 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>发布攻略</span>
                  </Link>
                  <Link to="/profile" className="flex items-center space-x-2">
                    <img
                      src={user?.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                      alt={user?.username}
                      className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                    />
                    <span className="hidden sm:block text-gray-700 font-medium">{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="退出登录"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-primary-500 font-medium">
                    登录
                  </Link>
                  <Link to="/register" className="btn-primary">
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 旅行僧 - 发现世界的美好</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
