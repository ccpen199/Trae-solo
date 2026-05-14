import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getArticle, likeArticle, favoriteArticle } from '../api/articles';
import { getComments, createComment, likeComment } from '../api/comments';
import { followUser } from '../api/users';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { PageLoading, ButtonLoading } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import Avatar from '../components/Avatar';
import {
  ThumbsUp, Star, MessageCircle, Share2, Eye,
  UserPlus, Clock, ChevronUp, Send, Heart
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToastStore();
  
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [articleRes, commentsRes] = await Promise.all([
        getArticle(id),
        getComments({ targetType: 'article', targetId: id, page: 1, pageSize: 50 })
      ]);

      if (articleRes?.success) {
        setArticle(articleRes.data);
      } else {
        throw new Error(articleRes?.message || '获取文章失败');
      }

      if (commentsRes?.success) {
        setComments(commentsRes.data?.list || []);
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading({ ...actionLoading, like: true });
    try {
      const res = await likeArticle(id);
      if (res?.success) {
        setArticle({
          ...article,
          isLiked: res.data.isLiked,
          likesCount: res.data.likesCount
        });
        toast.success(res.data.isLiked ? '已点赞' : '已取消点赞');
      }
    } catch (err) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading({ ...actionLoading, like: false });
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading({ ...actionLoading, favorite: true });
    try {
      const res = await favoriteArticle(id);
      if (res?.success) {
        setArticle({
          ...article,
          isFavorited: res.data.isFavorited,
          favoritesCount: res.data.favoritesCount
        });
        toast.success(res.data.isFavorited ? '已收藏' : '已取消收藏');
      }
    } catch (err) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading({ ...actionLoading, favorite: false });
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading({ ...actionLoading, follow: true });
    try {
      const res = await followUser(article.authorId);
      if (res?.success) {
        setArticle({
          ...article,
          isFollowing: res.data.isFollowing,
          author: {
            ...article.author,
            followersCount: res.data.followersCount
          }
        });
        toast.success(res.data.isFollowing ? '已关注' : '已取消关注');
      }
    } catch (err) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading({ ...actionLoading, follow: false });
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentInput.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await createComment({
        targetType: 'article',
        targetId: id,
        content: commentInput.trim()
      });
      if (res?.success) {
        setComments([res.data, ...comments]);
        setArticle({ ...article, commentsCount: (article.commentsCount || 0) + 1 });
        setCommentInput('');
        toast.success('评论成功');
      }
    } catch (err) {
      toast.error(err.message || '评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await likeComment(commentId);
      if (res?.success) {
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, isLiked: res.data.isLiked, likesCount: res.data.likesCount }
            : c
        ));
      }
    } catch (err) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制');
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!article) return <ErrorState message="文章不存在" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex gap-6">
        <main className="flex-1">
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
            <header className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Link to={`/user/${article.author?.id}`} className="flex-shrink-0">
                  <Avatar src={article.author?.avatar} alt={article.author?.nickname} size="lg" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/user/${article.author?.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {article.author?.nickname || article.author?.username}
                    </Link>
                    {user && user.id !== article.author?.id && (
                      <button
                        onClick={handleFollow}
                        disabled={actionLoading.follow}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          article.isFollowing
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50`}
                      >
                        <span className="flex items-center gap-1">
                          <UserPlus size={12} />
                          {article.isFollowing ? '已关注' : '关注'}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {dayjs(article.createdAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {article.viewsCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {article.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {article.category?.name && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {article.category.name}
                  </span>
                )}
                {article.tags?.split(',').filter(Boolean).map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </header>

            <div
              className="prose-content text-gray-700"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <footer className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    disabled={actionLoading.like}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                      article.isLiked
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {article.isLiked ? <Heart size={18} fill="currentColor" /> : <ThumbsUp size={18} />}
                    <span className="text-sm font-medium">{article.likesCount || 0}</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    disabled={actionLoading.favorite}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                      article.isFavorited
                        ? 'bg-amber-50 text-amber-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Star size={18} fill={article.isFavorited ? 'currentColor' : 'none'} />
                    <span className="text-sm font-medium">{article.favoritesCount || 0}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Share2 size={18} />
                    <span className="text-sm font-medium">分享</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MessageCircle size={16} />
                  {article.commentsCount || 0} 条评论
                </div>
              </div>
            </footer>
          </article>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle size={18} />
              评论 ({comments.length})
            </h2>

            {user ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-3">
                  <Avatar src={user.avatar} alt={user.nickname} size="sm" />
                  <div className="flex-1">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="写下你的评论..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentInput.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send size={14} />
                        {submittingComment ? '发送中...' : '发送'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">登录</Link>
                  后即可发表评论
                </p>
              </div>
            )}

            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <Link to={`/user/${comment.user?.id}`} className="flex-shrink-0">
                      <Avatar src={comment.user?.avatar} alt={comment.user?.nickname} size="sm" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/user/${comment.user?.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {comment.user?.nickname || comment.user?.username}
                        </Link>
                        <span className="text-xs text-gray-400">
                          {dayjs(comment.createdAt).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            comment.isLiked
                              ? 'text-red-500'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <ThumbsUp size={14} />
                          {comment.likesCount || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">暂无评论，快来发表第一条评论吧</p>
              </div>
            )}
          </div>
        </main>

        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <Link to={`/user/${article.author?.id}`}>
                <Avatar src={article.author?.avatar} alt={article.author?.nickname} size="lg" />
              </Link>
              <div className="min-w-0">
                <Link
                  to={`/user/${article.author?.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {article.author?.nickname || article.author?.username}
                </Link>
                <p className="text-xs text-gray-500">
                  {article.author?.followersCount || 0} 粉丝 · {article.author?.articlesCount || 0} 文章
                </p>
              </div>
            </div>
            {article.author?.bio && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{article.author.bio}</p>
            )}
            {user && user.id !== article.author?.id && (
              <button
                onClick={handleFollow}
                disabled={actionLoading.follow}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  article.isFollowing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {article.isFollowing ? '已关注' : '+ 关注'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
