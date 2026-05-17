import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaPlus, FaUser } from 'react-icons/fa';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 z-40">
      <div className="flex items-center justify-around py-3">
        <Link
          to="/"
          className={`flex flex-col items-center space-y-1 ${
            isActive('/') ? 'text-pink-500' : 'text-gray-400'
          }`}
        >
          <FaHome className="text-xl" />
          <span className="text-xs">首页</span>
        </Link>

        <Link
          to="/submit"
          className={`flex flex-col items-center space-y-1 ${
            isActive('/submit') ? 'text-pink-500' : 'text-gray-400'
          }`}
        >
          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center -mt-6 shadow-lg">
            <FaPlus className="text-white text-xl" />
          </div>
          <span className="text-xs">投稿</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center space-y-1 ${
            isActive('/profile') ? 'text-pink-500' : 'text-gray-400'
          }`}
        >
          <FaUser className="text-xl" />
          <span className="text-xs">我的</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
