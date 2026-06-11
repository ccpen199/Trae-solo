import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, LayoutGrid, List, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const API = '/api';

interface Talent {
  id: string;
  name: string;
  avatar: string;
  major: string;
  grade: string;
  university: string;
  skills: string[];
  rating: number;
  credit_score: number;
}

interface TalentsResponse {
  data: Talent[];
  total: number;
  page: number;
  page_size: number;
}

function getStatusInfo(credit_score: number) {
  if (credit_score >= 80) return { label: '可上岗', className: 'badge-success' };
  if (credit_score >= 60) return { label: '空闲', className: 'badge-warning' };
  return { label: '预警', className: 'badge-danger' };
}

export default function Talents() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [search, setSearch] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');
  const [skill, setSkill] = useState('');
  const [universities, setUniversities] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);

  const fetchTalents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (search) params.set('search', search);
      if (university) params.set('university', university);
      if (major) params.set('major', major);
      if (grade) params.set('grade', grade);
      if (skill) params.set('skill', skill);
      const res = await fetch(`${API}/talents?${params}`);
      if (!res.ok) throw new Error('获取人才列表失败');
      const json = await res.json();
      const d = json.data ?? json;
      const items = d.items ?? d ?? [];
      setTalents(items);
      setTotal(d.total ?? 0);
      if (items.length > 0) {
        const uniSet = new Set<string>();
        const majorSet = new Set<string>();
        items.forEach((t: Talent) => {
          if (t.university) uniSet.add(t.university);
          if (t.major) majorSet.add(t.major);
        });
        setUniversities((prev) => {
          const merged = new Set([...prev, ...uniSet]);
          return Array.from(merged);
        });
        setMajors((prev) => {
          const merged = new Set([...prev, ...majorSet]);
          return Array.from(merged);
        });
      }
    } catch (err: any) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, university, major, grade, skill]);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">人才库</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card-base p-5 h-fit">
          <h3 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <SlidersHorizontal size={16} />筛选条件
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">学校</label>
              <select value={university} onChange={(e) => { setUniversity(e.target.value); setPage(1); }} className="input-base">
                <option value="">全部学校</option>
                {universities.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">专业</label>
              <select value={major} onChange={(e) => { setMajor(e.target.value); setPage(1); }} className="input-base">
                <option value="">全部专业</option>
                {majors.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">年级</label>
              <select value={grade} onChange={(e) => { setGrade(e.target.value); setPage(1); }} className="input-base">
                <option value="">全部年级</option>
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="研一">研一</option>
                <option value="研二">研二</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">技能</label>
              <select value={skill} onChange={(e) => { setSkill(e.target.value); setPage(1); }} className="input-base">
                <option value="">全部技能</option>
                <option value="Python">Python</option>
                <option value="数据分析">数据分析</option>
                <option value="Office">Office</option>
                <option value="Java">Java</option>
                <option value="SQL">SQL</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">搜索</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="姓名/专业"
                  className="input-base pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading && <div className="text-center py-12 text-gray-400 animate-fade-in">加载中...</div>}
          {error && <div className="text-center py-12 text-red-500 animate-fade-in">{error}</div>}
          {!loading && !error && talents.length === 0 && (
            <div className="text-center py-12 text-gray-400 animate-fade-in">暂无数据</div>
          )}
          {!loading && !error && talents.length > 0 && (
            <>
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {talents.map((talent, i) => {
                    const statusInfo = getStatusInfo(talent.credit_score);
                    return (
                      <div
                        key={talent.id}
                        onClick={() => navigate(`/talents/${talent.id}`)}
                        className={`card-base p-5 cursor-pointer animate-fade-in stagger-${Math.min(i + 1, 4)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-lg">
                            {talent.avatar || talent.name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-heading font-semibold text-gray-800">{talent.name}</h4>
                              <span className={statusInfo.className}>{statusInfo.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{talent.major} · {talent.grade}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-accent">{talent.credit_score}</span>
                            <p className="text-xs text-gray-400">信用分</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {talent.skills.map((s) => (
                            <span key={s} className="bg-primary/5 text-primary px-2 py-0.5 rounded text-xs">{s}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs text-gray-600 font-mono">{talent.rating}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card-base overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">姓名</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">专业</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">技能</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">状态</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">评分</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">信用分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {talents.map((talent) => {
                        const statusInfo = getStatusInfo(talent.credit_score);
                        return (
                          <tr
                            key={talent.id}
                            onClick={() => navigate(`/talents/${talent.id}`)}
                            className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{talent.avatar || talent.name[0]}</div>
                                <span className="text-sm font-medium text-gray-800">{talent.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{talent.major} · {talent.grade}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">{talent.skills.slice(0, 2).map((s) => <span key={s} className="bg-primary/5 text-primary px-2 py-0.5 rounded text-xs">{s}</span>)}</div>
                            </td>
                            <td className="py-3 px-4"><span className={statusInfo.className}>{statusInfo.label}</span></td>
                            <td className="py-3 px-4 font-mono text-sm">{talent.rating}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-accent">{talent.credit_score}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-600 font-mono">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
