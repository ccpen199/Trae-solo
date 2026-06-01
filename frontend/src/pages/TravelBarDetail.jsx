import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MessageSquare, Send } from 'lucide-react';
import { travelBarAPI, commentAPI, userAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const TravelBarDetail = () => {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchTopic();
    fetchComments();
  }, [id]);

  const fetchTopic = async () => {
    try {
      const response = await travelBarAPI.getTravelBarById(id);
      setTopic(response.data);
    } catch (error) {
      console.error('获取话题详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getComments({ travel_bar_id: id });
      setComments(response.data);
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      await travelBarAPI.toggleLike(id);
      setTopic(prev => ({
        ...prev,
        is_liked: !prev.is_liked,
        likes: prev.is_liked ? prev.likes - 1 : prev.likes + 1
      }));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !newComment.trim()) return;

    setCommentLoading(true);
    try {
      await commentAPI.createComment({ travel_bar_id: id, content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('评论失败:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">话题不存在或已被删除</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <img
            src={topic.author_avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
            alt={topic.author_name}
            className="h-14 w-14 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{topic.author_name}</p>
                <p className="text-sm text-gray-500">发布于 {new Date(topic.created_at).toLocaleString()}</p>
              </div>
              {isAuthenticated && user?.id !== topic.author_id && (
                <button
                  onClick={() => {}}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {isFollowing ? '已关注' : '关注'}
                </button>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">{topic.title}</h1>
        <div className="text-gray-600 whitespace-pre-line leading-relaxed mb-6">
          {topic.content}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              topic.is_liked
                ? 'bg-red-50 text-red-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
          >
            <Heart className={`h-5 w-5 ${topic.is_liked && 'fill-current'}`} />
            <span>{topic.likes || 0}</span>
          </button>
          <span className="flex items-center gap-2 text-gray-500">
            <MessageSquare className="h-5 w-5" />
            {comments.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary-500" />
          评论 ({comments.length})
        </h3>

        {isAuthenticated && (
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex gap-4">
              <img
                src={user?.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                alt={user?.username}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下您的评论..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {commentLoading ? '发送中...' : '发送评论'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">暂无评论，快来抢沙发吧！</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <img
                  src={comment.author_avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                  alt={comment.author_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{comment.author_name}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelBarDetail;
