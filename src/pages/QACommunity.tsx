import { useState, useEffect } from 'react';
import {
  MessageCircle,
  ThumbsUp,
  Send,
  User,
  Clock,
  Tag,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
  GraduationCap,
  Users,
  Briefcase,
  Star,
  ChevronRight,
} from 'lucide-react';
import { qa } from '@/api/client';
import type { QAQuestion, QAAnswer, User as UserType } from '../../shared/types';

const roleConfig = {
  student: { label: '考生', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  parent: { label: '家长', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  teacher: { label: '教师', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  expert: { label: '专家', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
};

const reviewStatusConfig = {
  pending: { label: '待审核', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  approved: { label: '已审核', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '已拒绝', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  answered: { label: '已回答', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  resolved: { label: '已解决', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  closed: { label: '已关闭', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
};

interface QuestionWithUser extends QAQuestion {
  user?: UserType;
  tags?: string[];
  answerCount?: number;
}

interface AnswerWithUser extends QAAnswer {
  user?: UserType;
  liked?: boolean;
}

export default function QACommunity() {
  const [questions, setQuestions] = useState<QuestionWithUser[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithUser | null>(null);
  const [answers, setAnswers] = useState<AnswerWithUser[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [likingId, setLikingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadQuestions();
  }, [filter]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await qa.getQuestions(params);
      if (response.success && response.data) {
        setQuestions(response.data.items as QuestionWithUser[]);
      }
    } catch (err) {
      setError('加载问题列表失败');
      console.error('加载问题列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionDetail = async (questionId: number) => {
    setQuestionLoading(true);
    setError(null);
    try {
      const response = await qa.getQuestion(questionId);
      if (response.success && response.data) {
        setSelectedQuestion(response.data.question as QuestionWithUser);
        setAnswers((response.data.answers as AnswerWithUser[]) || []);
      }
    } catch (err) {
      setError('加载问题详情失败');
      console.error('加载问题详情失败:', err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestionTitle.trim()) {
      setError('请输入问题标题');
      return;
    }
    if (newQuestionContent.trim().length < 10) {
      setError('问题内容至少需要10个字符');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await qa.createQuestion({
        title: newQuestionTitle,
        content: newQuestionContent,
        category: newQuestionCategory || undefined,
      });
      if (response.success && response.data) {
        setShowCreateModal(false);
        setNewQuestionTitle('');
        setNewQuestionContent('');
        setNewQuestionCategory('');
        setSuccessMessage('问题已提交，等待审核');
        loadQuestions();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('提交问题失败');
      console.error('提交问题失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !newAnswer.trim()) {
      setError('请输入回答内容');
      return;
    }

    setAnswering(true);
    setError(null);
    try {
      const response = await qa.createAnswer(selectedQuestion.id, {
        content: newAnswer,
      });
      if (response.success && response.data) {
        setAnswers((prev) => [...prev, response.data! as AnswerWithUser]);
        setNewAnswer('');
        setSuccessMessage('回答已提交');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('提交回答失败');
      console.error('提交回答失败:', err);
    } finally {
      setAnswering(false);
    }
  };

  const handleLikeAnswer = async (answerId: number) => {
    if (likingId === answerId) return;
    setLikingId(answerId);
    try {
      const response = await qa.likeAnswer(answerId);
      if (response.success) {
        setAnswers((prev) =>
          prev.map((a) =>
            a.id === answerId ? { ...a, likeCount: (a.likeCount || 0) + 1, liked: true } : a
          )
        );
      }
    } catch (err) {
      console.error('点赞失败:', err);
    } finally {
      setLikingId(null);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-3 h-3" />;
      case 'parent':
        return <Users className="w-3 h-3" />;
      case 'teacher':
        return <Briefcase className="w-3 h-3" />;
      case 'expert':
        return <Star className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getUserInitials = (user?: UserType) => {
    return (user?.name || '?').charAt(0).toUpperCase();
  };

  const isExpertUser = (user?: UserType) => {
    return user?.role === 'expert' || user?.expertCertified;
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setSelectedQuestion(null);
              setAnswers([]);
            }}
            className="flex items-center text-gray-600 hover:text-blue-600 font-medium mb-6 transition-colors"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            返回问题列表
          </button>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div className="text-green-700">{successMessage}</div>
              </div>
            </div>
          )}

          {questionLoading ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">正在加载问题详情...</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{selectedQuestion.title}</h1>
                  <div className="flex items-center gap-2">
                    {selectedQuestion.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          reviewStatusConfig[selectedQuestion.status as keyof typeof reviewStatusConfig]?.bgColor || 'bg-gray-100'
                        } ${
                          reviewStatusConfig[selectedQuestion.status as keyof typeof reviewStatusConfig]?.textColor || 'text-gray-700'
                        }`}
                      >
                        {
                          reviewStatusConfig[selectedQuestion.status as keyof typeof reviewStatusConfig]?.label || '未知'
                        }
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {getUserInitials(selectedQuestion.user)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {selectedQuestion.user?.name || '匿名用户'}
                      </span>
                      {selectedQuestion.user?.role && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                            roleConfig[selectedQuestion.user.role as keyof typeof roleConfig]?.bgColor || 'bg-gray-100'
                          } ${
                            roleConfig[selectedQuestion.user.role as keyof typeof roleConfig]?.textColor || 'text-gray-700'
                          }`}
                        >
                          {getRoleIcon(selectedQuestion.user.role)}
                          {
                            roleConfig[selectedQuestion.user.role as keyof typeof roleConfig]?.label || '用户'
                          }
                        </span>
                      )}
                      {isExpertUser(selectedQuestion.user) && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-current" />
                          认证专家
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(selectedQuestion.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {selectedQuestion.viewCount || 0} 次浏览
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-blue max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedQuestion.content}
                  </p>
                </div>

                {selectedQuestion.category && (
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {selectedQuestion.category}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  回答 ({answers.length})
                </h2>

                {answers.length > 0 ? (
                  <div className="space-y-6">
                    {answers.map((answer) => {
                      const isExpert = isExpertUser(answer.user);
                      return (
                        <div
                          key={answer.id}
                          className={`p-6 rounded-xl border-2 transition-colors ${
                            isExpert ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100 bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  isExpert ? 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg' : 'bg-gray-400'
                                }`}
                              >
                                {getUserInitials(answer.user)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {answer.user?.name || '匿名用户'}
                                  </span>
                                  {isExpert && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-1 shadow-md">
                                      <Star className="w-3 h-3 fill-current" />
                                      认证专家
                                    </span>
                                  )}
                                  {answer.user?.role && answer.user.role !== 'expert' && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                                        roleConfig[answer.user.role as keyof typeof roleConfig]?.bgColor || 'bg-gray-100'
                                      } ${
                                        roleConfig[answer.user.role as keyof typeof roleConfig]?.textColor || 'text-gray-700'
                                      }`}
                                    >
                                      {getRoleIcon(answer.user.role)}
                                      {
                                        roleConfig[answer.user.role as keyof typeof roleConfig]?.label || '用户'
                                      }
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(answer.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleLikeAnswer(answer.id)}
                              disabled={likingId === answer.id || answer.liked}
                              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                                answer.liked
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'text-gray-400 hover:bg-gray-100 hover:text-blue-600'
                              } disabled:opacity-50`}
                            >
                              {likingId === answer.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ThumbsUp className="w-4 h-4" />
                              )}
                              <span className="text-sm">{answer.likeCount || 0}</span>
                            </button>
                          </div>

                          <div className="prose prose-blue max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {answer.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">暂无回答，快来第一个回答吧！</p>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">撰写回答</h3>
                  <textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="分享你的见解和建议..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none mb-4"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={answering || !newAnswer.trim()}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {answering ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          提交中...
                        </span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          提交回答
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">问答社区</h1>
            <p className="text-gray-600">与考生、家长、老师和专家交流志愿填报问题</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            提问
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div className="text-green-700">{successMessage}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'all' ? '全部' : reviewStatusConfig[f]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">正在加载问题列表...</p>
          </div>
        ) : filteredQuestions.length > 0 ? (
          <div className="space-y-4">
            {filteredQuestions.map((question) => {
              const statusConfig = reviewStatusConfig[question.status as keyof typeof reviewStatusConfig];
              const isExpert = isExpertUser(question.user);
              return (
                <div
                  key={question.id}
                  onClick={() => loadQuestionDetail(question.id)}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors pr-4">
                      {question.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {statusConfig && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          {statusConfig.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {question.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {getUserInitials(question.user)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {question.user?.name || '匿名用户'}
                          </span>
                          {isExpert && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-1 shadow-md">
                              <Star className="w-3 h-3 fill-current" />
                              认证专家
                            </span>
                          )}
                          {question.user?.role && !isExpert && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                                roleConfig[question.user.role as keyof typeof roleConfig]?.bgColor || 'bg-gray-100'
                              } ${
                                roleConfig[question.user.role as keyof typeof roleConfig]?.textColor || 'text-gray-700'
                              }`}
                            >
                              {getRoleIcon(question.user.role)}
                              {
                                roleConfig[question.user.role as keyof typeof roleConfig]?.label || '用户'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {question.answerCount || 0} 回答
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {question.viewCount || 0}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>

                  {question.category && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {question.category}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <MessageCircle className="w-20 h-20 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无问题</h3>
            <p className="text-gray-600 mb-6">成为第一个提问的人吧！</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              我要提问
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">发起提问</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题标题
                </label>
                <input
                  type="text"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  placeholder="简洁地描述你的问题"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类（可选）
                </label>
                <input
                  type="text"
                  value={newQuestionCategory}
                  onChange={(e) => setNewQuestionCategory(e.target.value)}
                  placeholder="例如：志愿填报、专业选择、院校选择"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题详情
                </label>
                <textarea
                  value={newQuestionContent}
                  onChange={(e) => setNewQuestionContent(e.target.value)}
                  placeholder="详细描述你的情况和疑问..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateQuestion}
                disabled={submitting || !newQuestionTitle.trim() || !newQuestionContent.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </span>
                ) : (
                  '提交问题'
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              问题提交后需要经过审核才能公开显示
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
