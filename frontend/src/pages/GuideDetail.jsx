import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Heart, Bookmark, MessageSquare, Send } from 'lucide-react';
import { guideAPI, commentAPI, userAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const GuideDetail = () => {
  const { id } = useParams();
  const [guide, setGuide] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchGuide();
    fetchComments();
  }, [id]);

  const fetchGuide = async () => {
    try {
      const response = await guideAPI.getGuideById(id);
      setGuide(response.data);
    } catch (error) {
      console.error('获取攻略详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getComments({ guide_id: id });
      setComments(response.data);
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      await guideAPI.toggleLike(id);
      setGuide(prev => ({
        ...prev,
        is_liked: !prev.is_liked,
        likes: prev.is_liked ? prev.likes - 1 : prev.likes + 1
      }));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) return;
    try {
      await guideAPI.toggleFavorite(id);
      setGuide(prev => ({
        ...prev,
        is_favorited: !prev.is_favorited
      }));
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !newComment.trim()) return;

    setCommentLoading(true);
    try {
      await commentAPI.createComment({ guide_id: id, content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('评论失败:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !guide) return;
    try {
      await userAPI.toggleFollow(guide.author_id);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('关注失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">攻略不存在或已被删除</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="relative h-72">
          <img
            src={guide.cover_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20guide%20beautiful%20scenery&image_size=landscape_16_9`}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {guide.destination_name}
              </span>
              {guide.tags?.map((tag, index) => (
                <span key={index} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold">{guide.title}</h1>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/profile`} className="flex items-center gap-3">
                <img
                  src={guide.author_avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                  alt={guide.author_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-800">{guide.author_name}</p>
                  <p className="text-sm text-gray-500">发布于 {new Date(guide.created_at).toLocaleDateString()}</p>
                </div>
              </Link>
              {isAuthenticated && user?.id !== guide.author_id && (
                <button
                  onClick={handleFollow}
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
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  guide.is_liked
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
              >
                <Heart className={`h-5 w-5 ${guide.is_liked && 'fill-current'}`} />
                <span>{guide.likes || 0}</span>
              </button>
              <button
                onClick={handleFavorite}
                disabled={!isAuthenticated}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  guide.is_favorited
                    ? 'bg-yellow-50 text-yellow-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
              >
                <Bookmark className={`h-5 w-5 ${guide.is_favorited && 'fill-current'}`} />
                <span>{guide.is_favorited ? '已收藏' : '收藏'}</span>
              </button>
            </div>
          </div>
        </div>

        {guide.itinerary && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              行程安排
            </h3>
            <p className="text-gray-600 whitespace-pre-line">{guide.itinerary}</p>
          </div>
        )}

        {guide.budget && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary-500" />
              预算说明
            </h3>
            <p className="text-gray-600">{guide.budget}</p>
          </div>
        )}

        {guide.preparation && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-500" />
              出行准备
            </h3>
            <p className="text-gray-600">{guide.preparation}</p>
          </div>
        )}

        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">攻略详情</h3>
          <div className="text-gray-600 whitespace-pre-line leading-relaxed">
            {guide.content}
          </div>
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

        {!isAuthenticated && (
          <div className="text-center py-6 bg-gray-50 rounded-xl mb-6">
            <p className="text-gray-500">
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">登录</Link>
              {' '}后发表评论
            </p>
          </div>
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

export default GuideDetail;
