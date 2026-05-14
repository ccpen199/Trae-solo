import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark, Send, Tag } from 'lucide-react';
import { postApi, commentApi } from '../api/client';
import useStore from '../store/useStore';

const PostDetail = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await postApi.getPost(postId);
      setPost(data.data);
    } catch (err) {
      console.error('Load post error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await commentApi.getComments(postId);
      setComments(data.data.comments || []);
    } catch (err) {
      console.error('Load comments error:', err);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const data = await postApi.likePost(post.id);
      setPost({
        ...post,
        is_liked: data.data.liked,
        likes_count: data.data.liked ? post.likes_count + 1 : post.likes_count - 1
      });
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleFavorite = async () => {
    if (!post) return;
    try {
      const data = await postApi.favoritePost(post.id);
      setPost({ ...post, is_favorited: data.data.favorited });
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);
      await commentApi.createComment(postId, { content: newComment.trim() });
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Send comment error:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">帖子不存在</p>
        <button
          onClick={() => navigate('/square')}
          className="mt-4 text-purple-500"
        >
          返回广场
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate('/square')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="font-medium text-gray-800">动态详情</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
              {(post.nickname || post.username)?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{post.nickname || post.username}</h3>
              <p className="text-gray-400 text-sm">{post.created_at}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <span key={index} className="flex items-center gap-1 bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm">
                  <Tag size={14} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm transition ${
                post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
              <span className="font-medium">{post.likes_count || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500">
              <Send size={20} />
              <span className="font-medium">分享</span>
            </button>
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-2 text-sm transition ml-auto ${
                post.is_favorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
              }`}
            >
              <Bookmark size={20} fill={post.is_favorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-4">评论 ({comments.length})</h3>
          
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>暂无评论</p>
              <p className="text-sm">快来发表第一条评论吧</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {comment.nickname?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{comment.nickname || '用户'}</span>
                      <span className="text-xs text-gray-400">{comment.created_at}</span>
                    </div>
                    <p className="text-gray-600">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
            {(user?.nickname || user?.username)?.[0]?.toUpperCase() || '?'}
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder="发表评论..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
          <button
            onClick={handleSendComment}
            disabled={!newComment.trim() || sending}
            className="p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
