import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { communityAPI } from '../utils/api';

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await communityAPI.getPosts();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await communityAPI.likePost(post.id);
      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1, liked: !p.liked }
          : p
      ));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const loadComments = async (postId) => {
    try {
      const data = await communityAPI.getComments(postId);
      setComments(data.comments || []);
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    setShowComments(true);
    await loadComments(post.id);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    try {
      await communityAPI.addComment(selectedPost.id, commentText);
      setCommentText('');
      await loadComments(selectedPost.id);
      setPosts(posts.map(p =>
        p.id === selectedPost.id
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('评论失败:', error);
    }
  };

  const handleFollow = async (postUserId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await communityAPI.followUser(postUserId);
    } catch (error) {
      console.error('关注失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">会拍社区</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌐</div>
            <p className="text-gray-500 mb-4">暂无内容，去拍摄页面拍照分享吧！</p>
            <button
              onClick={() => navigate('/camera')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium"
            >
              去拍摄
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden post-card">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
                    {post.nickname ? post.nickname.charAt(0).toUpperCase() : post.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{post.nickname || post.username}</div>
                    {post.location && (
                      <div className="text-xs text-gray-500">📍 {post.location}</div>
                    )}
                  </div>
                </div>
                {user && post.user_id !== user.id && (
                  <button
                    onClick={() => handleFollow(post.user_id)}
                    className="text-xs text-purple-600 font-medium px-3 py-1 rounded-full border border-purple-200 hover:bg-purple-50"
                  >
                    关注
                  </button>
                )}
              </div>

              <div className="aspect-square bg-gray-100">
                <img
                  src={post.photo_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'}
                  alt="帖子图片"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3">
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => handleLike(post)}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <span className="text-xl">{post.liked ? '❤️' : '🤍'}</span>
                    <span className="text-sm">{post.likes_count || 0}</span>
                  </button>
                  <button
                    onClick={() => openComments(post)}
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
                  >
                    <span className="text-xl">💬</span>
                    <span className="text-sm">{post.comments_count || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-green-500 transition-colors">
                    <span className="text-xl">↗️</span>
                    <span className="text-sm">{post.shares_count || 0}</span>
                  </button>
                </div>

                {post.caption && (
                  <p className="text-sm text-gray-800 mb-2">{post.caption}</p>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showComments && selectedPost && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowComments(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">评论 ({selectedPost.comments_count})</h3>
              <button onClick={() => setShowComments(false)} className="text-gray-500 text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无评论，快来抢沙发！</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {comment.nickname ? comment.nickname.charAt(0).toUpperCase() : comment.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{comment.nickname || comment.username}</div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isAuthenticated && (
              <div className="p-4 border-t flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;