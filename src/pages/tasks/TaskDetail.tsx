import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  Upload,
  MessageSquare,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Send,
  Shield,
  Plus,
  Star,
  Award,
  Users,
} from 'lucide-react';
import { taskApi, submissionApi, messageApi, financeApi } from '../../lib/api';
import { useAuth } from '../../store/authStore';
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS } from '../../../shared/types';
import type { Task, Bid, Submission, Message, Talent } from '../../../shared/types';
import { cn } from '../../lib/utils';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchingTalents, setMatchingTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bids' | 'submissions' | 'messages' | 'milestones'>('overview');
  const [newMessage, setNewMessage] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [bidForm, setBidForm] = useState({ proposal: '', budget: 0, durationDays: 0 });
  const [submissionForm, setSubmissionForm] = useState({ title: '', description: '' });
  const [reviewForm, setReviewForm] = useState({ status: 'approved' as const, comment: '', score: 5 });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [taskData, bidsData, submissionsData, messagesData] = await Promise.all([
          taskApi.getById(Number(id)),
          taskApi.getList().then(() => []),
          submissionApi.getByTask(Number(id)),
          messageApi.getMessages(Number(id)),
        ]);
        setTask(taskData);
        setSubmissions(submissionsData);
        setMessages(messagesData);
        
        if (taskData.status === 'bidding' && user?.role === 'employer') {
          const talents = await taskApi.getMatchingTalents(Number(id));
          setMatchingTalents(talents);
        }
      } catch (err) {
        console.error('Failed to fetch task details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user?.role]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;
    try {
      const msg = await messageApi.send(Number(id), { content: newMessage, type: 'text' });
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSubmitBid = async () => {
    if (!id) return;
    try {
      await taskApi.createBid(Number(id), bidForm);
      setShowBidModal(false);
      setBidForm({ proposal: '', budget: 0, durationDays: 0 });
    } catch (err) {
      console.error('Failed to submit bid:', err);
    }
  };

  const handleSelectProvider = async (bid: Bid) => {
    if (!id) return;
    try {
      const updated = await taskApi.selectProvider(Number(id), bid.providerId, bid.id);
      setTask(updated);
    } catch (err) {
      console.error('Failed to select provider:', err);
    }
  };

  const handleSubmitSubmission = async () => {
    if (!id) return;
    try {
      const files = [{
        id: Date.now().toString(),
        name: 'placeholder.pdf',
        url: '/uploads/placeholder.pdf',
        size: 1024,
        type: 'application/pdf',
        hash: 'sha256_placeholder'
      }];
      const submission = await submissionApi.create(Number(id), { ...submissionForm, files });
      setSubmissions([...submissions, submission]);
      setShowSubmissionModal(false);
      setSubmissionForm({ title: '', description: '' });
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;
    try {
      const updated = await submissionApi.review(selectedSubmission.id, reviewForm);
      setSubmissions(submissions.map(s => s.id === updated.id ? updated : s));
      setShowReviewModal(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Failed to review:', err);
    }
  };

  const handleEscrow = async (amount: number) => {
    if (!id) return;
    try {
      await financeApi.escrow({ taskId: Number(id), amount });
      const updated = await taskApi.getById(Number(id));
      setTask(updated);
    } catch (err) {
      console.error('Failed to escrow:', err);
    }
  };

  const handleReleasePayment = async (milestoneId: string, amount: number) => {
    if (!id) return;
    try {
      await financeApi.release({ taskId: Number(id), amount, milestoneId });
      const updated = await taskApi.getById(Number(id));
      setTask(updated);
    } catch (err) {
      console.error('Failed to release payment:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-blue-100 text-blue-700',
      bidding: 'bg-yellow-100 text-yellow-700',
      selected: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-indigo-100 text-indigo-700',
      submitted: 'bg-orange-100 text-orange-700',
      reviewing: 'bg-pink-100 text-pink-700',
      completed: 'bg-green-100 text-green-700',
      disputed: 'bg-red-100 text-red-700',
      approved: 'bg-green-100 text-green-700',
      revision_requested: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">任务不存在</p>
        <button onClick={() => navigate('/tasks')} className="mt-4 text-blue-600 hover:underline">
          返回任务列表
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '概览' },
    { id: 'bids', label: `投标 (${bids.length})` },
    { id: 'submissions', label: `稿件 (${submissions.length})` },
    { id: 'milestones', label: '里程碑' },
    { id: 'messages', label: `沟通 (${messages.length})` },
  ];

  const canBid = user?.role === 'provider' && task.status === 'bidding';
  const canSubmit = user?.role === 'provider' && task.status === 'in_progress' && task.providerId === user.id;
  const canReview = user?.role === 'employer' && task.employerId === user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">{task.title}</h1>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(task.status))}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
              {TASK_TYPE_LABELS[task.type]}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              预算 ¥{task.budgetMin.toLocaleString()} - ¥{task.budgetMax.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              周期 {task.durationDays} 天
            </span>
            {task.provider && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                服务商: {task.provider.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {canBid && (
            <button
              onClick={() => setShowBidModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              我要投标
            </button>
          )}
          {canSubmit && (
            <button
              onClick={() => setShowSubmissionModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              提交稿件
            </button>
          )}
          {task.status === 'selected' && canReview && (
            <button
              onClick={() => handleEscrow(task.finalBudget || task.budgetMax)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all"
            >
              <Shield className="w-4 h-4" />
              托管资金
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">需求描述</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">交付标准</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{task.deliveryStandards}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">审核节点</h3>
              <div className="space-y-3">
                {task.reviewNodes.map((node, idx) => (
                  <div key={node.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                      node.completed ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                    )}>
                      {node.completed ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{node.name}</p>
                      <p className="text-sm text-slate-500">{node.description}</p>
                    </div>
                    {node.completed && node.completedAt && (
                      <span className="text-sm text-green-600">
                        已完成 {new Date(node.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">项目进度</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">总体进度</span>
                    <span className="font-medium text-slate-800">
                      {task.reviewNodes.filter(n => n.completed).length / task.reviewNodes.length * 100}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                      style={{ width: `${task.reviewNodes.filter(n => n.completed).length / task.reviewNodes.length * 100}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{task.milestones.filter(m => m.completed).length}</p>
                    <p className="text-sm text-slate-500">已完成里程碑</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{task.milestones.length}</p>
                    <p className="text-sm text-slate-500">总里程碑</p>
                  </div>
                </div>
              </div>
            </div>

            {task.employer && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">需求方</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {task.employer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{task.employer.name}</p>
                    <p className="text-sm text-slate-500">企业雇主</p>
                  </div>
                </div>
              </div>
            )}

            {matchingTalents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">智能匹配推荐</h3>
                <div className="space-y-3">
                  {matchingTalents.slice(0, 3).map(talent => (
                    <div key={talent.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {talent.user?.name?.charAt(0) || 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 truncate">{talent.user?.name}</p>
                          {talent.verified && <Award className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-slate-600">{talent.rating.toFixed(1)}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{talent.completedProjects} 项目</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bids' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {bids.length > 0 ? (
            <div className="space-y-4">
              {bids.map(bid => (
                <div key={bid.id} className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {bid.provider?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800">{bid.provider?.name}</p>
                          {bid.talent?.verified && <Award className="w-4 h-4 text-blue-500" />}
                        </div>
                        {bid.talent && (
                          <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              {bid.talent.rating.toFixed(1)}
                            </span>
                            <span>{bid.talent.completedProjects} 个完成项目</span>
                            <span>{bid.talent.onTimeRate}% 按时率</span>
                          </div>
                        )}
                        <p className="text-slate-600 text-sm">{bid.proposal}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-800">¥{bid.budget.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">{bid.durationDays} 天</p>
                      {task.status === 'bidding' && canReview && (
                        <button
                          onClick={() => handleSelectProvider(bid)}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          选中服务商
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无投标</h3>
              <p className="text-slate-500">等待服务商提交投标方案</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissions.length > 0 ? (
            submissions.map(submission => (
              <div key={submission.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-slate-800">{submission.title}</h4>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                        版本 {submission.version}
                      </span>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getStatusColor(submission.status))}>
                        {submission.status === 'approved' ? '已通过' :
                         submission.status === 'revision_requested' ? '需修改' :
                         submission.status === 'under_review' ? '评审中' : '已提交'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">{submission.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(submission.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {submission.provider?.name}
                      </span>
                    </div>
                  </div>
                  {canReview && submission.status === 'submitted' && (
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setShowReviewModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      开始评审
                    </button>
                  )}
                </div>

                {submission.files.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">交付文件</p>
                    <div className="flex flex-wrap gap-2">
                      {submission.files.map(file => (
                        <div key={file.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {submission.ipRecord && (
                  <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">知识产权已存证</p>
                      <p className="text-xs text-blue-600 font-mono">
                        SHA256: {submission.ipRecord.fileHash.slice(0, 20)}...
                      </p>
                    </div>
                  </div>
                )}

                {submission.reviewComment && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 mb-1">评审意见</p>
                    <p className="text-slate-600 text-sm">{submission.reviewComment}</p>
                    {submission.reviewScore !== null && (
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < submission.reviewScore!
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-slate-300'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无稿件提交</h3>
              <p className="text-slate-500">服务商将在此提交工作成果</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="space-y-4">
            {task.milestones.map((milestone, idx) => (
              <div key={milestone.id} className="relative pl-8 pb-6 last:pb-0">
                {idx < task.milestones.length - 1 && (
                  <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-slate-200" />
                )}
                <div className={cn(
                  'absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2',
                  milestone.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : milestone.status === 'released'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                )}>
                  {milestone.completed || milestone.status === 'released' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">{milestone.name}</h4>
                    <span className="text-lg font-bold text-slate-800">
                      ¥{milestone.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{milestone.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      截止日期: {new Date(milestone.dueDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        milestone.completed
                          ? 'bg-green-100 text-green-700'
                          : milestone.status === 'released'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-200 text-slate-600'
                      )}>
                        {milestone.completed ? '已完成' : milestone.status === 'released' ? '已付款' : '待完成'}
                      </span>
                      {milestone.completed && milestone.status !== 'released' && canReview && (
                        <button
                          onClick={() => handleReleasePayment(milestone.id, milestone.amount)}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          确认打款
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? (
              messages.map(msg => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn('flex gap-3', isOwn ? 'justify-end' : '')}>
                    {!isOwn && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {msg.sender?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className={cn('max-w-[70%]', isOwn ? 'order-first' : '')}>
                      <div className={cn(
                        'px-4 py-2 rounded-2xl',
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      )}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className={cn(
                        'text-xs mt-1',
                        isOwn ? 'text-right text-slate-400' : 'text-slate-400'
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {isOwn && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">开始与服务商沟通吧</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入消息..."
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            </div>
          </div>
        </div>
      )}

      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">提交投标方案</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">方案说明</label>
                <textarea
                  value={bidForm.proposal}
                  onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="描述您的实施方案和优势"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">报价 (元)</label>
                  <input
                    type="number"
                    value={bidForm.budget || ''}
                    onChange={(e) => setBidForm({ ...bidForm, budget: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">工期 (天)</label>
                  <input
                    type="number"
                    value={bidForm.durationDays || ''}
                    onChange={(e) => setBidForm({ ...bidForm, durationDays: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitBid}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                提交投标
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">提交工作成果</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">稿件标题</label>
                <input
                  type="text"
                  value={submissionForm.title}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="例如：第一版设计稿"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">稿件说明</label>
                <textarea
                  value={submissionForm.description}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="详细说明本次提交的内容"
                />
              </div>
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 text-sm">点击或拖拽文件到此处上传</p>
                <p className="text-slate-400 text-xs mt-1">支持设计源文件、PDF、文档等</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitSubmission}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                提交稿件
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">评审稿件</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">评审结果</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value as 'approved' | 'revision_requested' })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="approved">通过</option>
                  <option value="revision_requested">需修改</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">评分</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, score: star })}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          star <= reviewForm.score
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-slate-300 hover:text-yellow-400'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">评审意见</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请详细说明评审意见"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedSubmission(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReviewSubmission}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                确认评审
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
