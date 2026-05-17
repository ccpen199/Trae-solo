import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, X, Users } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';
import { useToast } from '../components/Toast';

interface Moment {
  id: number;
  user_id: number;
  content: string;
  media_ids?: string;
  created_at: string;
  nickname: string;
  avatar?: string;
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
}

const Moments: React.FC = () => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { showToast } = useToast();

  const fetchMoments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/moments');
      setMoments(response.data.data?.list || []);
    } catch (err: any) {
      setError(err.errorMessage || '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  const handleLike = async (id: number) => {
    try {
      await apiClient.post(`/moments/${id}/like`);
      setMoments((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                is_liked: !m.is_liked,
                like_count: m.is_liked ? m.like_count - 1 : m.like_count + 1,
              }
            : m
        )
      );
    } catch (err: any) {
      showToast(err.errorMessage || '操作失败', 'error');
    }
  };

  const handlePost = async () => {
    if (!newContent.trim()) {
      showToast('请输入内容', 'error');
      return;
    }

    setIsPosting(true);
    try {
      await apiClient.post('/moments', {
        content: newContent,
        visibility: 'family',
      });
      showToast('发布成功！', 'success');
      setShowPostModal(false);
      setNewContent('');
      fetchMoments();
    } catch (err: any) {
      showToast(err.errorMessage || '发布失败', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream pb-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream pb-20 p-6">
        <div className="text-center card max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">加载失败</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchMoments} className="btn-primary">
            点击重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">亲友圈</h1>
            <p className="text-sm text-gray-500">分享宝宝的成长点滴</p>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-full font-medium shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            发布
          </button>
        </div>
      </header>

      <div className="px-6 py-4 space-y-4">
        {moments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">还没有动态</h3>
            <p className="text-gray-500 mb-6">点击右上角发布第一条动态吧</p>
          </div>
        ) : (
          moments.map((moment) => (
            <div key={moment.id} className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {moment.nickname?.charAt(0) || '👶'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{moment.nickname || '用户'}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(moment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">{moment.content}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleLike(moment.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    moment.is_liked
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${moment.is_liked ? 'fill-red-500' : ''}`} />
                  <span>{moment.like_count || 0}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all">
                  <MessageCircle className="w-5 h-5" />
                  <span>{moment.comment_count || 0}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all">
                  <Share2 className="w-5 h-5" />
                  <span>分享</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">发布动态</h2>
              <button
                onClick={() => setShowPostModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="分享宝宝的成长点滴..."
              className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none mb-6"
              maxLength={500}
            />
            <p className="text-right text-xs text-gray-400 mb-6">
              {newContent.length}/500
            </p>

            <button
              onClick={handlePost}
              disabled={isPosting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPosting ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Moments;
