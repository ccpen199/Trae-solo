import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Heart, X, MessageCircle, MapPin, Briefcase } from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/user/matches');
      console.log('Matches response:', res.data);
      setMatches(res.data.data);
    } catch (error) {
      console.error('Load matches error:', error);
      alert('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = () => {
    console.log('左滑点击', currentIndex, matches.length);
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert('已经是最后一个了！');
    }
  };

  const handleSwipeRight = (user) => {
    console.log('右滑点击', user);
    setSelectedUser(user);
    setShowAnswerModal(true);
  };

  const currentUser = matches[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="border-4 border-gray-200 border-t-red-500 w-12 h-12 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500">暂无匹配用户</p>
          <button
            onClick={loadMatches}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-red-500">JOIN</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/search')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => navigate('/profile-setup')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <User className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="relative h-64 bg-gradient-to-br from-pink-100 to-red-100">
            <img
              src={currentUser.avatar}
              alt={currentUser.nickname}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/400/400';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-2xl font-bold">
                {currentUser.nickname}, {currentUser.age}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentUser.currentCity}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {currentUser.industry}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm">
                {currentUser.graduationStatus}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                {currentUser.profession}
              </span>
              {currentUser.gender && (
                <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-sm">
                  {currentUser.gender}
                </span>
              )}
            </div>

            {currentUser.question && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">TA 的破冰问题：</p>
                <p className="text-gray-800 font-medium">"{currentUser.question.content}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleSwipeLeft}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
          >
            <X className="w-8 h-8 text-gray-400" />
          </button>
          <button
            onClick={() => handleSwipeRight(currentUser)}
            className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transition-all active:scale-95"
          >
            <Heart className="w-10 h-10 text-white" />
          </button>
          <button className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95">
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            左滑跳过 · 右滑想认识
          </p>
        </div>
      </div>

      {showAnswerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">回答破冰问题</h3>
              <button
                onClick={() => setShowAnswerModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-red-800 font-medium">
                {selectedUser?.question?.content || '为什么想认识我？'}
              </p>
            </div>

            <textarea
              placeholder="请输入你的回答..."
              className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />

            <button
              onClick={() => setShowAnswerModal(false)}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              发送好友申请
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;