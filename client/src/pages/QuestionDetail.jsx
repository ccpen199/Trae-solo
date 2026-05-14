import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getQuestion, likeQuestion, favoriteQuestion, getAnswers, createAnswer } from '../api/questions';
import { getComments, createComment, likeComment } from '../api/comments';
import { followUser } from '../api/users';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { PageLoading } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import Avatar from '../components/Avatar';
import {
  ThumbsUp, Star, MessageCircle, Share2, Eye,
  UserPlus, Clock, Send, Heart, HelpCircle, CheckCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToastStore();
  
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerInput, setAnswerInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionRes, answersRes, commentsRes] = await Promise.all([
        getQuestion(id),
        getAnswers(id, { page: 1, pageSize: 50 }),
        getComments({ targetType: 'question', targetId: id, page: 1, pageSize: 30 })
      ]);

      if (questionRes?.success) {
        setQuestion(questionRes.data);
      } else {
        throw new Error(questionRes?.message || '获取问题失败');
      }

      if (answersRes?.success) {
        setAnswers(answersRes.data?.list || []);
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
    if (!user) { navigate('/login'); return; }
    setActionLoading({ ...actionLoading, like: true });
    try {
      const res = await likeQuestion(id);
      if (res?.success) {
        setQuestion({ ...question, isLiked: res.data.isLiked, likesCount: res.data.likesCount });
        toast.success(res.data.isLiked ? '已点赞' : '已取消点赞');
      }
    } catch (err) { toast.error(err.message || '操作失败'); }
    finally { setActionLoading({ ...actionLoading, like: false }); }
  };

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading({ ...actionLoading, favorite: true });
    try {
      const res = await favoriteQuestion(id);
      if (res?.success) {
        setQuestion({ ...question, isFavorited: res.data.isFavorited, favoritesCount: res.data.favoritesCount });
        toast.success(res.data.isFavorited ? '已收藏' : '已取消收藏');
      }
    } catch (err) { toast.error(err.message || '操作失败'); }
    finally { setActionLoading({ ...actionLoading, favorite: false }); }
  };

  const handleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading({ ...actionLoading, follow: true });
    try {
      const res = await followUser(question.authorId);
      if (res?.success) {
        setQuestion({
          ...question,
          isFollowing: res.data.isFollowing,
          author: { ...question.author, followersCount: res.data.followersCount }
        });
        toast.success(res.data.isFollowing ? '已关注' : '已取消关注');
      }
    } catch (err) { toast.error(err.message || '操作失败'); }
    finally { setActionLoading({ ...actionLoading, follow: false }); }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!answerInput.trim()) return;
    setSubmittingAnswer(true);
    try {
      const res = await createAnswer(id, answerInput.trim());
      if (res?.success) {
        toast.success('回答发布成功');
        setAnswerInput('');
        fetchData();
      }
    } catch (err) { toast.error(err.message || '发布失败'); }
    finally { setSubmittingAnswer(false); }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!commentInput.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await createComment({ targetType: 'question', targetId: id, content: commentInput.trim() });
      if (res?.success) {
        setComments([res.data, ...comments]);
        setCommentInput('');
        toast.success('评论成功');
      }
    } catch (err) { toast.error(err.message || '评论失败'); }
    finally { setSubmittingComment(false); }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制');
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!question) return <ErrorState message="问题不存在" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <main className="flex-1">
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <header className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle size={16} className="text-purple-500" />
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">问题</span>
              {question.status && question.status !== 'open' && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  question.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {question.status === 'resolved' ? '已解决' : question.status}
                </span>
              )}
              {question.category?.name && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{question.category.name}</span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Link to={`/user/${question.author?.id}`}><Avatar src={question.author?.avatar} size="lg" /></Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/user/${question.author?.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {question.author?.nickname || question.author?.username}
                  </Link>
                  {user && user.id !== question.author?.id && (
                    <button
                      onClick={handleFollow}
                      disabled={actionLoading.follow}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        question.isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'
                      } disabled:opacity-50`}
                    >
                      {question.isFollowing ? '已关注' : '关注'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Clock size={14} />{dayjs(question.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                  <span className="flex items-center gap-1"><Eye size={14} />{question.viewsCount || 0}</span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{question.title}</h1>

            {question.tags && (
              <div className="flex flex-wrap gap-2">
                {question.tags.split(',').filter(Boolean).map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">#{tag.trim()}</span>
                ))}
              </div>
            )}
          </header>

          {question.content && (
            <div className="prose-content text-gray-700 mb-6 pb-6 border-b border-gray-100">
              <p className="whitespace-pre-wrap">{question.content}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={actionLoading.like}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  question.isLiked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                {question.isLiked ? <Heart size={18} fill="currentColor" /> : <ThumbsUp size={18} />}
                <span className="text-sm font-medium">{question.likesCount || 0}</span>
              </button>
              <button
                onClick={handleFavorite}
                disabled={actionLoading.favorite}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  question.isFavorited ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                <Star size={18} fill={question.isFavorited ? 'currentColor' : 'none'} />
                <span className="text-sm font-medium">{question.favoritesCount || 0}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                <Share2 size={18} /><span className="text-sm font-medium">分享</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MessageCircle size={16} />{comments.length} 评论</span>
              <span className="flex items-center gap-1"><CheckCircle size={16} />{question.answersCount || 0} 回答</span>
            </div>
          </div>
        </article>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle size={18} />问题评论 ({comments.length})
          </h2>
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-4">
              <div className="flex gap-3">
                <Avatar src={user.avatar} size="sm" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="写下你的评论..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComment || !commentInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
              <Link to="/login" className="text-blue-600 font-medium">登录</Link>后即可评论
            </div>
          )}
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <Link to={`/user/${comment.user?.id}`}><Avatar src={comment.user?.avatar} size="xs" /></Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/user/${comment.user?.id}`} className="font-medium text-gray-900">
                        {comment.user?.nickname || comment.user?.username}
                      </Link>
                      <span className="text-xs text-gray-400">{dayjs(comment.createdAt).fromNow()}</span>
                    </div>
                    <p className="text-gray-700 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle size={18} />回答 ({answers.length})
          </h2>
          {user ? (
            <form onSubmit={handleSubmitAnswer} className="mb-6">
              <div className="flex gap-3">
                <Avatar src={user.avatar} size="sm" />
                <div className="flex-1">
                  <textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="写下你的回答..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submittingAnswer || !answerInput.trim()}
                      className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      <Send size={14} />
                      {submittingAnswer ? '发布中...' : '发布回答'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">
                <Link to="/login" className="text-blue-600 font-medium">登录</Link>后即可回答
              </p>
            </div>
          )}
          {answers.length > 0 ? (
            <div className="space-y-4">
              {answers.map((answer) => (
                <div key={answer.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <Link to={`/user/${answer.author?.id}`}><Avatar src={answer.author?.avatar} size="sm" /></Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/user/${answer.author?.id}`} className="text-sm font-medium text-gray-900">
                        {answer.author?.nickname || answer.author?.username}
                      </Link>
                      {answer.isAccepted && (
                        <span className="flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          <CheckCircle size={12} />已采纳
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{dayjs(answer.createdAt).fromNow()}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{answer.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
                        <ThumbsUp size={12} />{answer.likesCount || 0}
                      </button>
                      <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500">
                        <MessageCircle size={12} />评论
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckCircle size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">暂无回答，快来发表你的见解吧</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
