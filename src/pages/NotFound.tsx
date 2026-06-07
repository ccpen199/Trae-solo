import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="text-center animate-fade-in">
        <div className="relative mb-8">
          <h1 className="text-[150px] font-bold text-primary-100 leading-none font-serif">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-20 h-20 text-primary-500 animate-float" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 font-serif">页面未找到</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          抱歉，您访问的页面不存在或已被移除。请检查URL是否正确，或返回首页继续浏览。
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          返回首页
        </button>
      </div>
    </div>
  );
};

export default NotFound;
