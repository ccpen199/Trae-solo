import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ThumbsUp, MessageCircle, Send, Eye } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');

  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  const fetchPostDetail = async () => {
    try {
      const response = await fetch(`/api/community/posts/${id}`);
      const data = await response.json();
      if (data.success) {
        setPost(data.data.post);
        setReplies(data.data.replies || []);
      }
    } catch (error) {
      console.error('Fetch post detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/community/posts/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId: id })
      });
      const data = await response.json();
      if (data.success) {
        showToast('操作成功', 'success');
        fetchPostDetail();
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleReply = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!newReply.trim()) {
      showToast('请输入回复内容', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/community/posts/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId: id, content: newReply })
      });
      const data = await response.json();
      if (data.success) {
        showToast('回复成功', 'success');
        setNewReply('');
        fetchPostDetail();
      } else {
        showToast(data.message || '回复失败', 'error');
      }
    } catch (error) {
      showToast('回复失败，请稍后重试', 'error');
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">帖子不存在</h3>
        <Link to="/community" className="text-blue-600 hover:text-blue-700">
          返回社区
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/community"
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        返回社区
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <p className="font-medium text-gray-800">{post.nickname || '用户'}</p>
              <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
            </div>
          </div>
          {post.is_elite && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
              精品
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>
        <p className="text-gray-600 whitespace-pre-wrap mb-6">{post.content}</p>

        <div className="flex items-center gap-6 pt-4 border-t">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>{post.like_count || 0}</span>
          </button>
          <span className="flex items-center gap-2 text-gray-500">
            <Eye className="w-5 h-5" />
            <span>{post.view_count || 0}</span>
          </span>
          <span className="flex items-center gap-2 text-gray-500">
            <MessageCircle className="w-5 h-5" />
            <span>{post.reply_count || 0} 回复</span>
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
            {post.category_name}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">发表回复</h2>
        <textarea
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder="写下你的想法..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4"
        />
        <div className="flex justify-end">
          <button
            onClick={handleReply}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            发表回复
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">全部回复 ({replies.length})</h2>
        {replies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无回复，快来抢沙发吧！</p>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{reply.nickname || '用户'}</span>
                    <span className="text-sm text-gray-500">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
