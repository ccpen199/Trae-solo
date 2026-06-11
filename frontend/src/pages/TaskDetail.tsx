import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Clock, User, FileText, Shield, Send, CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  Task, Bid, CATEGORY_MAP, TASK_STATUS_MAP, BUDGET_TYPE_MAP,
} from '../types';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidForm, setBidForm] = useState({ proposal: '', proposed_price: '', proposed_days: '' });
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [taskRes, bidsRes] = await Promise.all([
        api.get<any, { data: Task }>(`/tasks/${id}`),
        api.get<any, { data: Bid[] }>(`/tasks/${id}/bids`),
      ]);
      setTask(taskRes.data);
      setBids(bidsRes.data || []);
    } catch {
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setBidError('');
    setSubmitting(true);
    try {
      await api.post(`/tasks/${task.id}/bids`, {
        proposal: bidForm.proposal,
        proposed_price: Number(bidForm.proposed_price),
        proposed_days: Number(bidForm.proposed_days),
      });
      setBidForm({ proposal: '', proposed_price: '', proposed_days: '' });
      fetchData();
    } catch (err: any) {
      setBidError(err.message || '投标失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectProvider = async (providerId: number) => {
    if (!task) return;
    setSelecting(true);
    try {
      await api.post(`/tasks/${task.id}/select`, { provider_id: providerId });
      fetchData();
    } catch (err: any) {
      alert(err.message || '选标失败');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>;
  if (!task) return <div className="text-center py-12 text-gray-400">任务不存在</div>;

  const isEmployer = user?.role === 'employer' && task.employer_id === user.id;
  const isProvider = user?.role === 'provider';
  const canBid = isProvider && (task.status === 'published' || task.status === 'bidding');
  const canSelect = isEmployer && (task.status === 'bidding' || task.status === 'published');

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft size={16} /> 返回
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-lg">
                {CATEGORY_MAP[task.category] || task.category}
              </span>
              <StatusBadge status={task.status} />
              <span className="text-xs text-gray-400 ml-auto">{task.task_no}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-3">{task.title}</h1>
            <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-accent" />
                <div>
                  <div className="text-xs text-gray-400">预算</div>
                  <div className="text-sm font-semibold">¥{task.budget_min}-{task.budget_max}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                <div>
                  <div className="text-xs text-gray-400">周期</div>
                  <div className="text-sm font-semibold">{task.cycle_days}天</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-success" />
                <div>
                  <div className="text-xs text-gray-400">预算类型</div>
                  <div className="text-sm font-semibold">{BUDGET_TYPE_MAP[task.budget_type] || task.budget_type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User size={18} className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">雇主</div>
                  <div className="text-sm font-semibold">{task.employer_name}</div>
                </div>
              </div>
            </div>
          </div>

          {task.delivery_standards && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-2">交付标准</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.delivery_standards}</p>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">
              投标列表 ({bids.length})
            </h3>
            {bids.length === 0 ? (
              <p className="text-gray-400 text-sm">暂无投标</p>
            ) : (
              <div className="space-y-3">
                {bids.map((bid) => (
                  <div key={bid.id} className="p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                          {(bid.provider?.name || '?').charAt(0)}
                        </div>
                        <span className="font-medium text-sm">{bid.provider?.name || '服务商'}</span>
                        <StatusBadge status={bid.status} />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-accent">¥{bid.proposed_price}</div>
                        <div className="text-xs text-gray-400">{bid.proposed_days}天</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{bid.proposal}</p>
                    {canSelect && bid.status !== 'selected' && bid.status !== 'rejected' && (
                      <button
                        onClick={() => handleSelectProvider(bid.provider_id)}
                        disabled={selecting}
                        className="text-xs btn-primary py-1.5 px-4 flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        选标
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">任务信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                <span className="font-medium">{TASK_STATUS_MAP[task.status]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">分类</span>
                <span className="font-medium">{CATEGORY_MAP[task.category]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">投标数</span>
                <span className="font-medium">{task.bid_count}</span>
              </div>
              {task.nda_required && (
                <div className="flex items-center gap-1 text-warning">
                  <Shield size={14} />
                  <span className="text-xs">需要签署NDA</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">首付比例</span>
                <span className="font-medium">{task.prepayment_ratio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">知识产权</span>
                <span className="font-medium">{task.ip_ownership === 'employer' ? '雇主所有' : '服务商所有'}</span>
              </div>
            </div>
          </div>

          {canBid && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">提交投标</h3>
              {bidError && <div className="mb-3 p-2 bg-danger/10 text-danger text-xs rounded-xl">{bidError}</div>}
              <form onSubmit={handleSubmitBid} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">方案说明</label>
                  <textarea
                    value={bidForm.proposal}
                    onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                    className="input-field text-sm min-h-[80px]"
                    placeholder="请描述您的方案..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">报价 (元)</label>
                    <input
                      type="number"
                      value={bidForm.proposed_price}
                      onChange={(e) => setBidForm({ ...bidForm, proposed_price: e.target.value })}
                      className="input-field text-sm"
                      placeholder="报价"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">工期 (天)</label>
                    <input
                      type="number"
                      value={bidForm.proposed_days}
                      onChange={(e) => setBidForm({ ...bidForm, proposed_days: e.target.value })}
                      className="input-field text-sm"
                      placeholder="天数"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full text-sm flex items-center justify-center gap-1">
                  <Send size={14} />
                  {submitting ? '提交中...' : '提交投标'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
