import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Search, MapPin } from 'lucide-react';
import api, { handleApiError } from '../services/api';
import Loading from '../components/Loading';
import { showToast } from '../components/Toast';
import { Post } from '../types';

const Square: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommend' | 'follow'>('recommend');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts(true);
  }, [activeTab]);

  const fetchPosts = async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const res = await api.get('/posts', {
        params: {
          type: activeTab,
          page: reset ? 1 : page,
          limit: 10,
        },
      });
      if (res.data.success) {
        const newPosts = res.data.data.posts || [];
        setPosts(reset ? newPosts : [...posts, ...newPosts]);
        setHasMore(res.data.data.hasMore);
        setPage(reset ? 2 : page + 1);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: number, isLiked: boolean) => {
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, is_liked: !isLiked, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 }
        : p
    ));
    
    api.post('/posts/like', { postId }).catch(() => {
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, is_liked: isLiked, like_count: isLiked ? p.like_count + 1 : p.like_count - 1 }
          : p
      ));
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-8 pb-2">
          <div className="flex-1">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('recommend')}
                className={`pb-2 font-medium relative ${
                  activeTab === 'recommend' ? 'text-pink-500' : 'text-gray-500'
                }`}
              >
                推荐
                {activeTab === 'recommend' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-pink-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('follow')}
                className={`pb-2 font-medium relative ${
                  activeTab === 'follow' ? 'text-pink-500' : 'text-gray-500'
                }`}
              >
                关注
                {activeTab === 'follow' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-pink-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
          <Search size={20} className="text-gray-400" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🌱</div>
            <p className="mb-2">暂无动态</p>
            <p className="text-sm">快去发布你的第一条动态吧</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={post.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{post.nickname}</p>
                  {post.location && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} />
                      {post.location}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>

              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {post.images.slice(0, 3).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt=""
                      className="aspect-square rounded-lg object-cover bg-gray-100"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <button
                  onClick={() => toggleLike(post.id, post.is_liked)}
                  className="flex items-center gap-1.5 text-gray-500"
                >
                  <Heart
                    size={18}
                    fill={post.is_liked ? '#ec4899' : 'none'}
                    className={post.is_liked ? 'text-pink-500' : ''}
                  />
                  <span className="text-sm">{post.like_count || 0}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-500">
                  <MessageCircle size={18} />
                  <span className="text-sm">评论</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-500">
                  <Share2 size={18} />
                  <span className="text-sm">分享</span>
                </button>
              </div>
            </div>
          ))
        )}

        {loading && <Loading />}
        
        {hasMore && !loading && posts.length > 0 && (
          <button
            onClick={() => fetchPosts()}
            className="w-full py-3 text-center text-gray-500 text-sm"
          >
            加载更多
          </button>
        )}
      </div>
    </div>
  );
};

export default Square;
