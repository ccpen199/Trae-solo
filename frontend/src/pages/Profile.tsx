import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Edit } from 'lucide-react';
import useStore from '../store/useStore';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 pt-8 pb-16">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">我的</h1>
          <Settings size={22} />
        </div>

        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`}
            alt=""
            className="w-16 h-16 rounded-full border-2 border-white object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{user?.nickname || 'Soul用户'}</h2>
              <Edit size={16} className="opacity-70" />
            </div>
            <p className="text-sm opacity-80 mt-1">ID: {user?.id}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500">关注</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500">粉丝</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500">动态</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
            <span className="text-gray-700">我的瞬间</span>
            <span className="text-gray-400">›</span>
          </button>
          <div className="h-px bg-gray-100 mx-4" />
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
            <span className="text-gray-700">我的收藏</span>
            <span className="text-gray-400">›</span>
          </button>
          <div className="h-px bg-gray-100 mx-4" />
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
            <span className="text-gray-700">我的标签</span>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
            <span className="text-gray-700">设置</span>
            <span className="text-gray-400">›</span>
          </button>
          <div className="h-px bg-gray-100 mx-4" />
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
            <span className="text-gray-700">隐私</span>
            <span className="text-gray-400">›</span>
          </button>
          <div className="h-px bg-gray-100 mx-4" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-4 hover:bg-gray-50 text-pink-500"
          >
            <LogOut size={18} />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
