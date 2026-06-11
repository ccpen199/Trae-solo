import { useState, useEffect, useCallback } from 'react';
import { FileText, Gamepad2, Share2, Clock, Gift, TrendingUp, X, ChevronDown, ChevronUp, Users } from 'lucide-react';

const API = '/api';

type TaskType = 'survey' | 'trial_play' | 'share';

interface MicroTask {
  id: number;
  title: string;
  type: TaskType;
  description?: string;
  reward: number;
  progress: number;
  total: number;
  quota?: number;
  deadline: string;
  participants: number;
  status?: string;
  org_id?: number;
  created_at?: string;
  submissions?: Submission[];
}

interface Submission {
  id: number;
  student_id: number;
  student_name?: string;
  result: string;
  status: string;
  created_at?: string;
}

interface TaskStats {
  completion_rate: number;
  approval_rate: number;
  total_reward_paid: number;
}

interface MicroTaskListResponse {
  items: MicroTask[];
  total: number;
}

const typeConfig: Record<TaskType, { icon: typeof FileText; label: string; color: string }> = {
  survey: { icon: FileText, label: '问卷', color: 'bg-blue-50 text-blue-600' },
  trial_play: { icon: Gamepad2, label: '体验', color: 'bg-purple-50 text-purple-600' },
  share: { icon: Share2, label: '分享', color: 'bg-teal-50 text-teal-600' },
};

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

export default function MicroTasks() {
  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [taskStats, setTaskStats] = useState<Record<number, TaskStats>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  const [form, setForm] = useState({ title: '校园服务体验反馈', type: 'survey' as TaskType, description: '完成校园兼职服务体验问卷并提交截图。', reward: 5, quota: 50 });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<MicroTaskListResponse | MicroTask[]>('/micro-tasks');
      const items = Array.isArray(data) ? data : data.items;
      setTasks(items.map(normalizeTask));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const activeTasks = tasks.filter(t => t.status === 'published' || !t.status).length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalRewards = tasks.reduce((sum, t) => sum + (t.reward * (t.progress || 0)), 0);
  const totalParticipants = tasks.reduce((sum, t) => sum + (t.participants || 0), 0);

  const stats = [
    { label: '进行中任务', value: activeTasks, icon: Clock, color: 'bg-blue-50 text-blue-600' },
    { label: '已完成任务', value: completedTasks, icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
    { label: '累计奖励', value: totalRewards, icon: Gift, color: 'bg-accent/10 text-accent' },
    { label: '参与人次', value: totalParticipants, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  const handleExpand = async (taskId: number) => {
    if (expandedId === taskId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(taskId);
    if (!taskStats[taskId]) {
      try {
        const [statsData, detail] = await Promise.all([
          apiFetch<TaskStats>(`/micro-tasks/${taskId}/stats`),
          apiFetch<MicroTask>(`/micro-tasks/${taskId}`),
        ]);
        setTaskStats(prev => ({ ...prev, [taskId]: statsData }));
        setTasks(prev => prev.map(task => task.id === taskId ? normalizeTask(detail) : task));
      } catch {
        // stats fetch failed silently
      }
    }
  };

  const handleCreate = async () => {
    try {
      await apiFetch('/micro-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          description: form.description,
          reward: form.reward,
          quota: form.quota,
          org_id: 1,
          status: 'published',
        }),
      });
      setShowCreate(false);
      setForm({ title: '校园服务体验反馈', type: 'survey', description: '完成校园兼职服务体验问卷并提交截图。', reward: 5, quota: 50 });
      fetchTasks();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSubmit = async (taskId: number) => {
    setSubmitting(taskId);
    try {
      await apiFetch(`/micro-tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: 1, result: '已完成任务并提交凭证' }),
      });
      await fetchTasks();
      setExpandedId(taskId);
      const statsData = await apiFetch<TaskStats>(`/micro-tasks/${taskId}/stats`);
      const detail = await apiFetch<MicroTask>(`/micro-tasks/${taskId}`);
      setTaskStats(prev => ({ ...prev, [taskId]: statsData }));
      setTasks(prev => prev.map(task => task.id === taskId ? normalizeTask(detail) : task));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">喵任务</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary">创建任务</button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`card-base p-4 animate-fade-in stagger-${i + 1}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${s.color}`}><Icon size={18} /></div>
                <div>
                  <p className="text-xl font-bold font-heading font-mono">
                    {s.label === '累计奖励' ? `¥${s.value}` : s.value}
                  </p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无任务</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task, i) => {
            const config = typeConfig[task.type] || typeConfig.survey;
            const Icon = config.icon;
            const percent = task.total > 0 ? Math.round((task.progress / task.total) * 100) : 0;
            const isExpanded = expandedId === task.id;
            const stats = taskStats[task.id];
            return (
              <div key={task.id} className={`card-base overflow-hidden animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${config.color}`}><Icon size={16} /></div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.color} font-medium`}>{config.label}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                      <Gift size={12} />
                      <span className="font-mono text-sm font-bold">{task.reward}</span>
                    </div>
                  </div>
                  <h4 className="font-heading font-semibold text-gray-800 mb-2">{task.title}</h4>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>进度 {task.progress}/{task.total}</span>
                      <span className="font-mono">{percent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={12} />截止 {task.deadline}</span>
                    <span className="flex items-center gap-1"><Users size={12} />{task.participants}人参与</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSubmit(task.id)}
                      disabled={submitting === task.id}
                      className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
                    >
                      {submitting === task.id ? '提交中...' : '接受任务'}
                    </button>
                    <button
                      onClick={() => handleExpand(task.id)}
                      className="btn-outline text-sm py-2 px-3 flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      详情
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50 animate-fade-in">
                    <h5 className="font-heading font-semibold text-gray-700 text-sm mb-3">任务效果追踪</h5>
                    {stats && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <p className="font-mono font-bold text-primary text-lg">{stats.completion_rate}%</p>
                          <p className="text-xs text-gray-400">完成率</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono font-bold text-emerald-600 text-lg">{stats.approval_rate}%</p>
                          <p className="text-xs text-gray-400">审核通过率</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono font-bold text-accent text-lg">¥{stats.total_reward_paid}</p>
                          <p className="text-xs text-gray-400">已发放奖励</p>
                        </div>
                      </div>
                    )}
                    {task.submissions && task.submissions.length > 0 ? (
                      <div>
                        <h6 className="text-xs text-gray-500 mb-2">提交记录</h6>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {task.submissions.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2">
                              <span className="text-gray-600">{sub.student_name || `学生#${sub.student_id}`}</span>
                              <span className="text-gray-500">{sub.result}</span>
                              <span className={sub.status === 'approved' ? 'badge-success' : sub.status === 'pending' ? 'badge-warning' : 'badge-danger'}>
                                {sub.status === 'approved' ? '已通过' : sub.status === 'pending' ? '待审核' : '已拒绝'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">暂无提交记录</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-gray-800 text-lg">创建任务</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">任务标题</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-base" placeholder="输入任务标题" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">任务类型</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TaskType }))} className="input-base">
                  <option value="survey">问卷</option>
                  <option value="trial_play">体验</option>
                  <option value="share">分享</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">任务描述</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" rows={3} placeholder="描述任务要求" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">奖励金额</label>
                  <input type="number" value={form.reward} onChange={e => setForm(f => ({ ...f, reward: Number(e.target.value) }))} className="input-base" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">名额</label>
                  <input type="number" value={form.quota} onChange={e => setForm(f => ({ ...f, quota: Number(e.target.value) }))} className="input-base" />
                </div>
              </div>
              <button onClick={handleCreate} className="w-full btn-accent py-2.5">发布任务</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeTask(task: MicroTask): MicroTask {
  const completed = Number((task as any).completed ?? task.progress ?? 0);
  const quota = Number(task.quota ?? task.total ?? 0);
  const taskType = String(task.type) as string;
  return {
    ...task,
    type: (taskType === 'trial' ? 'trial_play' : taskType) as TaskType,
    progress: completed,
    total: quota,
    participants: Number(task.participants ?? completed),
    deadline: task.deadline || String(task.created_at || '').slice(0, 10) || '长期有效',
  };
}
