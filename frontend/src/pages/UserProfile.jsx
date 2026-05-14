import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, UserPlus } from 'lucide-react';
import { userApi, matchApi, chatApi } from '../api/client';

const UserProfile = () => {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userApi.getUser(userId);
      setProfileUser(data.data);
    } catch (err) {
      console.error('Load user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!profileUser) return;
    try {
      setMatching(true);
      await matchApi.createMatch(profileUser.id);
      alert('匹配成功！');
    } catch (err) {
      console.error('Match error:', err);
    } finally {
      setMatching(false);
    }
  };

  const handleChat = async () => {
    if (!profileUser) return;
    try {
      const data = await chatApi.startChat(profileUser.id);
      navigate(`/chat/${data.data.chat_id}`);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">用户不存在</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-purple-500"
        >
          返回星球
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="font-medium text-gray-800">用户资料</h2>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-4">
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
              {(profileUser.nickname || profileUser.username)?.[0]?.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{profileUser.nickname || profileUser.username}</h2>
            <p className="text-gray-500">@{profileUser.username}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">个人简介</h3>
            <p className="text-gray-700">{profileUser.bio || '这个人很懒，什么都没写'}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleMatch}
              disabled={matching}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition disabled:opacity-50"
            >
              <UserPlus size={20} />
              {matching ? '匹配中...' : '匹配'}
            </button>
            <button
              onClick={handleChat}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition"
            >
              <MessageCircle size={20} />
              发消息
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-2">注册时间</h3>
          <p className="text-gray-500 text-sm">{profileUser.created_at}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
