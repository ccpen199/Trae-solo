import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Task, Message, Submission, CATEGORY_MAP, TASK_STATUS_MAP,
} from '../types';
import {
  MessageSquare, Upload, CheckCircle, DollarSign, AlertTriangle,
  Send, FileText, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  { value: 'in_progress', label: '进行中' },
  { value: 'reviewing', label: '审核中' },
  { value: 'completed', label: '已完成' },
  { value: 'disputed', label: '争议中' },
];

export default function Workspace() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activePanel, setActivePanel] = useState<'messages' | 'submissions' | 'actions'>('messages');

  const [msgContent, setMsgContent] = useState('');
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [disputeTitle, setDisputeTitle] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeType, setDisputeType] = useState('quality');
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTaskId) fetchTaskDetail();
  }, [selectedTaskId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get<any, { data: Task[] }>('/workspace/tasks', {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setTasks(res.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDetail = async () => {
    if (!selectedTaskId) return;
    try {
      const [detailRes, msgRes, subRes] = await Promise.all([
        api.get<any, { data: any }>(`/workspace/tasks/${selectedTaskId}`),
        api.get<any, { data: Message[] }>(`/workspace/tasks/${selectedTaskId}/messages`),
        api.get<any, { data: Submission[] }>(`/workspace/tasks/${selectedTaskId}/submissions`),
      ]);
      setTaskDetail(detailRes.data);
      setMessages(msgRes.data || []);
      setSubmissions(subRes.data || []);
    } catch {
      setTaskDetail(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !msgContent.trim()) return;
    try {
      await api.post(`/workspace/tasks/${selectedTaskId}/messages`, {
        content: msgContent,
        type: 'text',
      });
      setMsgContent('');
      const msgRes = await api.get<any, { data: Message[] }>(`/workspace/tasks/${selectedTaskId}/messages`);
      setMessages(msgRes.data || []);
    } catch {}
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !submitTitle.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/workspace/tasks/${selectedTaskId}/submissions`, {
        title: submitTitle,
        description: submitDesc,
      });
      setSubmitTitle('');
      setSubmitDesc('');
      fetchTaskDetail();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (submissionId: number, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      await api.post(`/workspace/submissions/${submissionId}/review`, {
        status,
        review_comments: reviewComments || (status === 'approved' ? '审核通过' : '需要修改'),
      });
      setReviewComments('');
      fetchTaskDetail();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedTaskId) return;
    setActionLoading(true);
    try {
      await api.post(`/workspace/tasks/${selectedTaskId}/accept`);
      fetchTaskDetail();
      fetchTasks();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !payAmount) return;
    setActionLoading(true);
    try {
      await api.post(`/workspace/tasks/${selectedTaskId}/pay`, {
        amount: Number(payAmount),
      });
      setPayAmount('');
      fetchTaskDetail();
      fetchTasks();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !disputeTitle.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/workspace/tasks/${selectedTaskId}/dispute`, {
        title: disputeTitle,
        description: disputeDesc,
        type: disputeType,
      });
      setDisputeTitle('');
      setDisputeDesc('');
      fetchTaskDetail();
      fetchTasks();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const isEmployer = user?.role === 'employer';
  const isProvider = user?.role === 'provider';
  const task = taskDetail;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">工作台</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === f.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">暂无任务</div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedTaskId === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium">
                        {CATEGORY_MAP[t.category] || t.category}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="text-sm font-medium text-gray-800 truncate">{t.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>¥{t.budget_min}-{t.budget_max}</span>
                      <span>{t.cycle_days}天</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {!task ? (
            <div className="card text-center py-16 text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p>请从左侧选择一个任务</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-lg font-medium">
                    {CATEGORY_MAP[task.category] || task.category}
                  </span>
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-gray-400 ml-auto">{task.task_no}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">{task.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} className="text-accent" />
                    ¥{task.budget_min}-{task.budget_max}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {task.cycle_days}天
                  </span>
                </div>
              </div>

              <div className="flex gap-2 border-b border-gray-200 pb-0">
                {([
                  { key: 'messages' as const, label: '沟通记录', icon: MessageSquare },
                  { key: 'submissions' as const, label: '稿件提交', icon: Upload },
                  { key: 'actions' as const, label: '操作', icon: CheckCircle },
                ]).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActivePanel(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activePanel === tab.key
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activePanel === 'messages' && (
                <div className="card">
                  <div className="max-h-[400px] overflow-y-auto mb-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">暂无消息</div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                                isOwn
                                  ? 'bg-primary text-white rounded-br-md'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <div className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                {new Date(msg.created_at).toLocaleString('zh-CN')}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      className="input-field flex-1 text-sm"
                      placeholder="输入消息..."
                    />
                    <button
                      type="submit"
                      disabled={!msgContent.trim()}
                      className="btn-primary px-4 flex items-center gap-1 text-sm disabled:opacity-40"
                    >
                      <Send size={14} />
                      发送
                    </button>
                  </form>
                </div>
              )}

              {activePanel === 'submissions' && (
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <div className="card text-center py-8 text-gray-400 text-sm">暂无稿件</div>
                  ) : (
                    submissions.map((sub) => (
                      <div key={sub.id} className="card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-800">{sub.title}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                V{sub.version}
                              </span>
                              <StatusBadge status={sub.status} />
                            </div>
                            {sub.description && (
                              <p className="text-sm text-gray-500">{sub.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(sub.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        {sub.review_comments && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                            <span className="text-xs text-gray-400">审核意见：</span>
                            {sub.review_comments}
                          </div>
                        )}
                        {isEmployer && (task.status === 'reviewing' || task.status === 'in_progress') && sub.status === 'pending' && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            <textarea
                              value={reviewComments}
                              onChange={(e) => setReviewComments(e.target.value)}
                              className="input-field text-sm min-h-[60px]"
                              placeholder="审核意见..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReview(sub.id, 'approved')}
                                disabled={actionLoading}
                                className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle size={14} /> 通过
                              </button>
                              <button
                                onClick={() => handleReview(sub.id, 'rejected')}
                                disabled={actionLoading}
                                className="px-4 py-1.5 text-xs border border-danger text-danger rounded-xl hover:bg-danger/5 disabled:opacity-50 flex items-center gap-1"
                              >
                                <AlertTriangle size={14} /> 驳回
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {isProvider && (task.status === 'in_progress' || task.status === 'reviewing') && (
                    <div className="card">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Upload size={16} />
                        提交稿件
                      </h4>
                      <form onSubmit={handleSubmitWork} className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">稿件标题 *</label>
                          <input
                            type="text"
                            value={submitTitle}
                            onChange={(e) => setSubmitTitle(e.target.value)}
                            className="input-field text-sm"
                            placeholder="请输入稿件标题"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">稿件说明</label>
                          <textarea
                            value={submitDesc}
                            onChange={(e) => setSubmitDesc(e.target.value)}
                            className="input-field text-sm min-h-[80px]"
                            placeholder="请描述稿件内容..."
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading || !submitTitle.trim()}
                          className="btn-primary text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          <Upload size={14} />
                          {actionLoading ? '提交中...' : '提交稿件'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activePanel === 'actions' && (
                <div className="space-y-4">
                  {isEmployer && (task.status === 'reviewing' || task.status === 'in_progress') && (
                    <div className="card">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-success">
                        <CheckCircle size={18} />
                        验收任务
                      </h4>
                      <p className="text-sm text-gray-500 mb-3">确认服务商已完成工作并通过审核后，点击验收</p>
                      <button
                        onClick={handleAccept}
                        disabled={actionLoading}
                        className="bg-success text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle size={16} />
                        {actionLoading ? '处理中...' : '确认验收'}
                      </button>
                    </div>
                  )}

                  {isEmployer && task.status === 'completed' && (
                    <div className="card">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-accent">
                        <DollarSign size={18} />
                        支付款项
                      </h4>
                      <form onSubmit={handlePay} className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">支付金额 (元) *</label>
                          <input
                            type="number"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="input-field text-sm"
                            placeholder="请输入支付金额"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading || !payAmount}
                          className="btn-accent text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          <DollarSign size={16} />
                          {actionLoading ? '处理中...' : '确认支付'}
                        </button>
                      </form>
                    </div>
                  )}

                  {(isEmployer || isProvider) && (task.status === 'in_progress' || task.status === 'reviewing' || task.status === 'disputed') && (
                    <div className="card">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-danger">
                        <AlertTriangle size={18} />
                        发起争议
                      </h4>
                      <form onSubmit={handleDispute} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">争议标题 *</label>
                            <input
                              type="text"
                              value={disputeTitle}
                              onChange={(e) => setDisputeTitle(e.target.value)}
                              className="input-field text-sm"
                              placeholder="请输入争议标题"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">争议类型</label>
                            <select
                              value={disputeType}
                              onChange={(e) => setDisputeType(e.target.value)}
                              className="input-field text-sm"
                            >
                              <option value="quality">质量问题</option>
                              <option value="deadline">交付延期</option>
                              <option value="payment">付款争议</option>
                              <option value="ip">知识产权</option>
                              <option value="other">其他</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">争议描述</label>
                          <textarea
                            value={disputeDesc}
                            onChange={(e) => setDisputeDesc(e.target.value)}
                            className="input-field text-sm min-h-[80px]"
                            placeholder="请详细描述争议情况..."
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading || !disputeTitle.trim()}
                          className="px-6 py-2.5 bg-danger text-white rounded-xl font-medium text-sm hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                        >
                          <AlertTriangle size={16} />
                          {actionLoading ? '提交中...' : '发起争议'}
                        </button>
                      </form>
                    </div>
                  )}

                  {task.status !== 'in_progress' && task.status !== 'reviewing' && task.status !== 'completed' && task.status !== 'disputed' && (
                    <div className="card text-center py-12 text-gray-400">
                      <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
                      <p>当前任务状态无需操作</p>
                      <p className="text-xs mt-1">状态：{TASK_STATUS_MAP[task.status] || task.status}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
