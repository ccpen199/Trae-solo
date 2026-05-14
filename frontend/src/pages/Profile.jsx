import React, { useState } from 'react';
import { User, Settings, LogOut, Heart, MessageSquare, Bookmark, Post } from 'lucide-react';
import useStore from '../store/useStore';

const Profile = () => {
  const { user, logout } = useStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const stats = [
    { icon: Post, label: '动态', value: 0 },
    { icon: Heart, label: '获赞', value: 0 },
    { icon: MessageSquare, label: '评论', value: 0 },
    { icon: Bookmark, label: '收藏', value: 0 },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的</h1>
          <p className="text-gray-500 text-sm">个人中心</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Settings size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {(user?.nickname || user?.username)?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.nickname || user?.username}</h2>
            <p className="text-white/70 text-sm">@{user?.username}</p>
          </div>
        </div>
        <p className="text-white/80 text-sm mb-4">{user?.bio || '这个人很懒，什么都没写'}</p>
        <div className="flex gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <Icon size={20} className="mx-auto mb-1 opacity-80" />
                <p className="font-bold">{stat.value}</p>
                <p className="text-xs opacity-70">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 w-full p-4 bg-red-50 rounded-xl text-red-500 hover:bg-red-100 transition"
        >
          <LogOut size={20} />
          <span className="font-medium">退出登录</span>
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-2">确认退出</h3>
            <p className="text-gray-500 mb-6">确定要退出当前账号吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
