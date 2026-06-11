import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, Plus, X, Users, FileText, Bot } from 'lucide-react';

const API = '/api';

type InterviewStatus = 'scheduled' | 'in_progress' | 'completed';

interface Interview {
  id: string;
  job_title: string;
  status: InterviewStatus;
  scheduled_at: string;
  type: string;
  participant_count?: number;
  file_count?: number;
  message_count?: number;
  summary?: string | null;
}

interface PublishedJob {
  id: string;
  title: string;
}

const statusMap: Record<InterviewStatus, { label: string; className: string }> = {
  scheduled: { label: '待开始', className: 'badge-info' },
  in_progress: { label: '进行中', className: 'badge-success' },
  completed: { label: '已结束', className: 'badge-warning' },
};

export default function Interviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [publishedJobs, setPublishedJobs] = useState<PublishedJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedType, setSelectedType] = useState('video');
  const [creating, setCreating] = useState(false);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/interviews?${params}`);
      if (!res.ok) throw new Error('获取面试列表失败');
      const json = await res.json();
      const d = json.data ?? json;
      setInterviews(d.items ?? d ?? []);
    } catch (err: any) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const openCreateModal = async () => {
    setShowModal(true);
    try {
      const res = await fetch(`${API}/jobs?status=published`);
      if (res.ok) {
        const json = await res.json();
        const d = json.data ?? json;
        setPublishedJobs(d.items ?? d ?? []);
      }
    } catch {}
  };

  const handleCreate = async () => {
    if (!selectedJobId) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: selectedJobId, type: selectedType }),
      });
      if (!res.ok) throw new Error('创建面试失败');
      setShowModal(false);
      setSelectedJobId('');
      setSelectedType('video');
      fetchInterviews();
    } catch (err: any) {
      alert(err.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">面试中心</h2>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={16} />发起面试
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'scheduled', 'in_progress', 'completed'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {!s ? '全部' : statusMap[s as InterviewStatus].label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400 animate-fade-in">加载中...</div>}
      {error && <div className="text-center py-12 text-red-500 animate-fade-in">{error}</div>}
      {!loading && !error && interviews.length === 0 && (
        <div className="text-center py-12 text-gray-400 animate-fade-in">暂无面试</div>
      )}
      {!loading && !error && interviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interviews.map((interview, i) => (
            <div
              key={interview.id}
              onClick={() => navigate(`/interviews/${interview.id}`)}
              className={`card-base p-5 cursor-pointer animate-fade-in stagger-${Math.min(i + 1, 4)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-heading font-semibold text-gray-800">{interview.job_title}</h4>
                  <p className="text-xs text-gray-400 mt-1">HR / 企业导师 / 学生三方协作</p>
                </div>
                <span className={statusMap[interview.status]?.className || 'badge-info'}>
                  {statusMap[interview.status]?.label || interview.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />{interview.scheduled_at}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={14} />{interview.type}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="rounded-lg bg-blue-50 px-3 py-2">
                  <div className="flex items-center gap-1 text-xs text-blue-600"><Users size={12} />参与者</div>
                  <p className="font-mono text-sm font-bold text-gray-800 mt-1">{interview.participant_count ?? 0}人</p>
                </div>
                <div className="rounded-lg bg-purple-50 px-3 py-2">
                  <div className="flex items-center gap-1 text-xs text-purple-600"><FileText size={12} />共享文件</div>
                  <p className="font-mono text-sm font-bold text-gray-800 mt-1">{interview.file_count ?? 0}份</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2">
                  <div className="flex items-center gap-1 text-xs text-emerald-600"><Bot size={12} />纪要</div>
                  <p className="font-mono text-sm font-bold text-gray-800 mt-1">{interview.summary ? '已沉淀' : `${interview.message_count ?? 0}条`}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-gray-800 text-lg">发起面试</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">选择岗位</label>
                <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="input-base">
                  <option value="">请选择岗位</option>
                  {publishedJobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">面试类型</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="input-base">
                  <option value="video">视频面试</option>
                  <option value="phone">电话面试</option>
                  <option value="onsite">现场面试</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={!selectedJobId || creating}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? '创建中...' : '确认发起'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
