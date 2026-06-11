import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp, Award, Clock, X } from 'lucide-react';

const API = '/api';

interface CreditProfile {
  user_id: number;
  credit_score: number;
  credit_level: string;
  records?: CreditRecord[];
}

interface CreditRecord {
  event: string;
  change: number;
  time: string;
  tags?: string[];
}

interface TrustTag {
  tag: string;
  count: number;
}

interface Evaluation {
  id: number;
  from_user_id: number;
  from_user_name: string;
  score: number;
  comment: string;
  tags: string[];
  job_title: string;
  created_at: string;
}

interface Talent {
  id: number;
  name: string;
}

const radarLabels = ['守时', '责任心', '技能水平', '团队协作', '沟通能力', '学习能力'];

const allTags = ['守时', '技能', '协作', '责任心', '沟通', '学习能力'];

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

function getLevelColor(level: string): string {
  if (level === '优秀') return 'text-emerald-600 bg-emerald-50';
  if (level === '良好') return 'text-blue-600 bg-blue-50';
  if (level === '一般') return 'text-amber-600 bg-amber-50';
  if (level === '较差') return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

function RadarChart({ dimensions }: { dimensions: { label: string; score: number }[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 80;
  const count = dimensions.length;
  const angleStep = (2 * Math.PI) / count;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const points = dimensions.map((d, i) => getPoint(i, d.score));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px] mx-auto">
      {[20, 40, 60, 80, 100].map((level) => {
        const gridPoints = dimensions.map((_, i) => getPoint(i, level));
        const gridPath = gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return <path key={level} d={gridPath} fill="none" stroke="#E5E7EB" strokeWidth="0.5" />;
      })}
      {dimensions.map((_, i) => {
        const p = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth="0.5" />;
      })}
      <path d={pathD} fill="rgba(15, 76, 117, 0.15)" stroke="#0F4C75" strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0F4C75" />)}
      {dimensions.map((d) => {
        const idx = dimensions.indexOf(d);
        const labelP = getPoint(idx, 115);
        return <text key={d.label} x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-gray-600">{d.label}</text>;
      })}
    </svg>
  );
}

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={onChange ? 20 : 14}
          className={`${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} ${onChange ? 'cursor-pointer' : ''}`}
          onClick={() => onChange?.(star)}
        />
      ))}
    </div>
  );
}

export default function Credit() {
  const [activeTab, setActiveTab] = useState<'profile' | 'evaluations'>('profile');
  const [profile, setProfile] = useState<CreditProfile | null>(null);
  const [tags, setTags] = useState<TrustTag[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEval, setShowEval] = useState(false);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [evalForm, setEvalForm] = useState({ to_user_id: 0, score: 5, comment: '', selectedTags: [] as string[] });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, tagsData] = await Promise.all([
        apiFetch<CreditProfile>('/credit/1'),
        apiFetch<TrustTag[]>('/credit/1/tags'),
      ]);
      setProfile(profileData);
      setTags(tagsData || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvaluations = useCallback(async () => {
    try {
      const data = await apiFetch<Evaluation[]>('/credit/1/evaluations');
      setEvaluations(data || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchEvaluations();
  }, [fetchProfile, fetchEvaluations]);

  const handleOpenEval = async () => {
    setShowEval(true);
    try {
      const data = await apiFetch<{ items: Talent[] } | Talent[]>('/talents?pageSize=50');
      const list = Array.isArray(data) ? data : (data as { items: Talent[] }).items || [];
      setTalents(list);
    } catch {
      // silently fail
    }
  };

  const handleSubmitEval = async () => {
    try {
      await apiFetch('/credit/1/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: 1,
          score: evalForm.score,
          comment: evalForm.comment,
          tags: evalForm.selectedTags,
          related_job_id: null,
        }),
      });
      setShowEval(false);
      setEvalForm({ to_user_id: 0, score: 5, comment: '', selectedTags: [] });
      fetchEvaluations();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const toggleTag = (tag: string) => {
    setEvalForm(f => ({
      ...f,
      selectedTags: f.selectedTags.includes(tag)
        ? f.selectedTags.filter(t => t !== tag)
        : [...f.selectedTags, tag],
    }));
  };

  const radarDimensions = radarLabels.map((label, i) => {
    const tagMatch = tags.find(t => t.tag === label || label.includes(t.tag));
    return {
      label,
      score: tagMatch ? Math.min(tagMatch.count * 10, 100) : 75 + i * 3,
    };
  });

  const tagColors = [
    'bg-blue-50 text-blue-700',
    'bg-purple-50 text-purple-700',
    'bg-emerald-50 text-emerald-700',
    'bg-amber-50 text-amber-700',
    'bg-teal-50 text-teal-700',
    'bg-rose-50 text-rose-700',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">信用体系</h2>
        <button onClick={handleOpenEval} className="btn-accent text-sm">评价</button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2 rounded-md text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-500'}`}
        >
          信用档案
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-5 py-2 rounded-md text-sm transition-all ${activeTab === 'evaluations' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-500'}`}
        >
          我的评价
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : activeTab === 'profile' && profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-base p-6 text-center">
            <h3 className="font-heading font-semibold text-gray-800 mb-4">多维度信用评分</h3>
            <RadarChart dimensions={radarDimensions} />
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`text-3xl font-bold font-heading font-mono ${getScoreColor(profile.credit_score)}`}>
                {profile.credit_score}
              </span>
              <span className="text-sm text-gray-500">/100</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">综合信用分</p>
            {profile.credit_level && (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(profile.credit_level)}`}>
                {profile.credit_level}
              </span>
            )}
          </div>

          <div className="card-base p-6">
            <h3 className="font-heading font-semibold text-gray-800 mb-4">信任标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <span key={t.tag} className={`${tagColors[i % tagColors.length]} px-3 py-1.5 rounded-full text-sm font-medium`}>
                  {t.tag} <span className="font-mono text-xs opacity-70">×{t.count}</span>
                </span>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {radarDimensions.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{d.label}</span>
                    <span className="font-mono text-primary font-medium">{d.score}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${d.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-base p-6">
            <h3 className="font-heading font-semibold text-gray-800 mb-4">信用记录</h3>
            <div className="space-y-3">
              {(profile.records || []).map((record, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="p-1 rounded bg-gray-100 mt-0.5"><Award size={12} className="text-gray-500" /></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{record.event}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">{record.time}</p>
                      {record.tags && record.tags.map(tag => (
                        <span key={tag} className="badge-info text-[10px] px-1.5 py-0">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-sm ${record.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {record.change > 0 ? `+${record.change}` : record.change}
                  </span>
                </div>
              ))}
              {(!profile.records || profile.records.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">暂无信用记录</p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'evaluations' ? (
        <div className="space-y-4">
          {evaluations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无评价</div>
          ) : (
            evaluations.map((evalItem) => (
              <div key={evalItem.id} className="card-base p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {evalItem.from_user_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{evalItem.from_user_name}</p>
                      <p className="text-xs text-gray-400">
                        <span className="badge-info text-[10px] mr-1">{evalItem.job_title || '评价者'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={evalItem.score} />
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{evalItem.created_at}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">{evalItem.comment}</p>
                {evalItem.tags && evalItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {evalItem.tags.map((tag) => (
                      <span key={tag} className="badge-info text-[10px]">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
                    <ThumbsUp size={12} />有帮助
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
                    <MessageSquare size={12} />回复
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {showEval && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowEval(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-gray-800 text-lg">评价</h3>
              <button onClick={() => setShowEval(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">评价对象</label>
                <select
                  value={evalForm.to_user_id}
                  onChange={e => setEvalForm(f => ({ ...f, to_user_id: Number(e.target.value) }))}
                  className="input-base"
                >
                  <option value={0}>选择学生</option>
                  {talents.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">评分</label>
                <StarRating rating={evalForm.score} onChange={r => setEvalForm(f => ({ ...f, score: r }))} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">评语</label>
                <textarea
                  value={evalForm.comment}
                  onChange={e => setEvalForm(f => ({ ...f, comment: e.target.value }))}
                  className="input-base"
                  rows={3}
                  placeholder="写下你的评价..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">标签</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        evalForm.selectedTags.includes(tag)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmitEval}
                disabled={!evalForm.to_user_id || !evalForm.comment}
                className="w-full btn-accent py-2.5 disabled:opacity-50"
              >
                提交评价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
