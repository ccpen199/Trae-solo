import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCog, FaSignOutAlt, FaMusic, FaHeart, FaThumbsUp, FaComment } from 'react-icons/fa';
import { recommendationApi } from '../api';
import { useUserStore, useUIStore } from '../store';
import { getStatusText, getStatusColor, formatDate } from '../utils';
import BottomNav from './BottomNav';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, logout, isAuthenticated } = useUserStore();
  const showToast = useUIStore((state) => state.showToast);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadRecommendations();
  }, [isAuthenticated, activeTab]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 20 };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const response = await recommendationApi.getMyRecommendations(params);
      if (response.data.success) {
        setRecommendations(response.data.data.list);
      }
    } catch (error) {
      console.error('加载失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('已退出登录', 'success');
    navigate('/login');
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '审核中' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col pb-24">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-xl font-bold">个人中心</h1>
          <div className="flex items-center space-x-4">
            <button className="text-white">
              <FaCog className="text-xl" />
            </button>
            <button onClick={handleLogout} className="text-white">
              <FaSignOutAlt className="text-xl" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <img
            src={user?.avatar}
            alt="avatar"
            className="w-16 h-16 rounded-full border-2 border-white"
          />
          <div>
            <h2 className="text-white text-lg font-bold">{user?.nickname || user?.username}</h2>
            <p className="text-white/70 text-sm">@{user?.username}</p>
          </div>
        </div>

        <div className="flex items-center justify-around mt-6">
          <div className="text-center">
            <p className="text-white text-xl font-bold">{recommendations.length}</p>
            <p className="text-white/70 text-sm">投稿</p>
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-bold">
              {recommendations.reduce((sum, r) => sum + (r.play_count || 0), 0)}
            </p>
            <p className="text-white/70 text-sm">播放</p>
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-bold">
              {recommendations.reduce((sum, r) => sum + (r.like_count || 0), 0)}
            </p>
            <p className="text-white/70 text-sm">获赞</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-700 bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-4 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'text-pink-500 border-b-2 border-pink-500'
                : 'text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400 py-8">加载中...</div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <FaMusic className="text-5xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无投稿记录</p>
            <button
              onClick={() => navigate('/submit')}
              className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-full text-sm"
            >
              去投稿
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={rec.song_cover}
                    alt={rec.song_title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{rec.song_title}</p>
                      <span className={`text-xs font-medium ${getStatusColor(rec.status)}`}>
                        {getStatusText(rec.status)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{rec.song_artist}</p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                      {rec.reason_text}
                    </p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <FaHeart />
                        <span>{rec.heart_count || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FaThumbsUp />
                        <span>{rec.like_count || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FaComment />
                        <span>{rec.comment_count || 0}</span>
                      </span>
                      <span>{formatDate(rec.submitted_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
