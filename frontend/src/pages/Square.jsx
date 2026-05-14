import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, MessageSquare, Bookmark, Plus, X, Tag } from 'lucide-react';
import { postApi, commentApi } from '../api/client';
import useStore from '../store/useStore';

const Square = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getPosts({ limit: 20 });
      setPosts(data.data.posts || []);
    } catch (err) {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post) => {
    try {
      const data = await postApi.likePost(post.id);
      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, is_liked: data.data.liked, likes_count: data.data.liked ? p.likes_count + 1 : p.likes_count - 1 }
          : p
      ));
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleFavorite = async (post) => {
    try {
      const data = await postApi.favoritePost(post.id);
      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, is_favorited: data.data.favorited }
          : p
      ));
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert('请输入内容');
      return;
    }

    try {
      setCreateLoading(true);
      const tags = newPostTags.split(',').map(t => t.trim()).filter(Boolean);
      await postApi.createPost({ content: newPostContent, tags });
      setShowCreateModal(false);
      setNewPostContent('');
      setNewPostTags('');
      loadPosts();
    } catch (err) {
      console.error('Create post error:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">广场</h1>
          <p className="text-gray-500 text-sm">发现精彩内容</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition"
        >
          <Plus size={16} />
          发布
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索动态..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 px-4 py-3 rounded-xl mb-4 text-center">
          {error}
          <button onClick={loadPosts} className="ml-2 underline">重试</button>
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无动态</p>
            <p className="text-sm">快来发布第一条动态吧</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {(post.nickname || post.username)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{post.nickname || post.username}</h3>
                  <p className="text-gray-400 text-xs">{post.created_at}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>

              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-full text-xs">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleLike(post)}
                  className={`flex items-center gap-1 text-sm transition ${
                    post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart size={18} fill={post.is_liked ? 'currentColor' : 'none'} />
                  <span>{post.likes_count || 0}</span>
                </button>
                <button
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition"
                >
                  <MessageSquare size={18} />
                  <span>{post.comments_count || 0}</span>
                </button>
                <button
                  onClick={() => handleFavorite(post)}
                  className={`flex items-center gap-1 text-sm transition ${
                    post.is_favorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
                  }`}
                >
                  <Bookmark size={18} fill={post.is_favorited ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">发布动态</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                {(user?.nickname || user?.username)?.[0]?.toUpperCase()}
              </div>
              <span className="font-medium text-gray-800">{user?.nickname || user?.username}</span>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="分享你的想法..."
              className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none mb-4"
            />

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签（用逗号分隔）
              </label>
              <input
                type="text"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                placeholder="例如：生活, 旅行, 美食"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <button
              onClick={handleCreatePost}
              disabled={createLoading}
              className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition disabled:opacity-50"
            >
              {createLoading ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Square;
