import { useEffect, useState, Fragment } from 'react';
import {
  Shield, Search, Filter, CheckCircle, XCircle, Award, Plus, Minus,
  ChevronDown, ChevronUp, User, Briefcase, Clock, AlertCircle, X, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Worker, CreditDistribution, PerformanceRecord, SkillCert, WorkerStatus } from '@shared/types';
import { cn } from '@/lib/utils';
import { get, patch } from '@/lib/api';

const BAR_COLORS = ['#EF4444', '#FF7A00', '#F59E0B', '#3B82F6', '#10B981'];

interface CreditRecord {
  id: string;
  date: string;
  type: 'add' | 'deduct';
  score: number;
  reason: string;
  operator: string;
}

interface WorkerExt extends Worker {
  creditRecords?: CreditRecord[];
}

function getScoreColor(score: number) {
  if (score >= 85) return 'text-success-600 bg-success-50';
  if (score >= 70) return 'text-blue-600 bg-blue-50';
  if (score >= 55) return 'text-warning-600 bg-warning-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-danger-600 bg-danger-50';
}

function getScoreGrade(score: number) {
  if (score >= 85) return { label: '优秀', cls: 'bg-success-500' };
  if (score >= 70) return { label: '良好', cls: 'bg-blue-500' };
  if (score >= 55) return { label: '一般', cls: 'bg-warning-500' };
  if (score >= 40) return { label: '较差', cls: 'bg-orange-500' };
  return { label: '危险', cls: 'bg-danger-500' };
}

const WORKER_STATUS_MAP: Record<WorkerStatus, string> = {
  idle: '待岗',
  interviewing: '面试中',
  onboarding: '入职中',
  employed: '在职',
  resigned: '已离职',
};

const LEAVE_TYPE_MAP: Record<string, { label: string; cls: string }> = {
  normal: { label: '正常离职', cls: 'bg-success-50 text-success-600' },
  abnormal: { label: '异常离职', cls: 'bg-warning-50 text-warning-600' },
  fired: { label: '违纪辞退', cls: 'bg-danger-50 text-danger-600' },
};

function generateCreditSource(worker: WorkerExt) {
  const parts: string[] = [];
  if (worker.idCardVerified) parts.push('实名认证+10分');
  worker.performanceHistory.forEach(p => {
    if (p.leaveType === 'normal') parts.push('正常离职+5分');
    else if (p.leaveType === 'abnormal') parts.push('异常离职-15分');
    else if (p.leaveType === 'fired') parts.push('违纪辞退-30分');
  });
  if (parts.length === 0) parts.push('暂无信用分变动记录');
  return parts.join(' / ');
}

export default function CreditScoreMgmt() {
  const [workers, setWorkers] = useState<WorkerExt[]>([]);
  const [creditDist, setCreditDist] = useState<CreditDistribution | null>(null);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<{ worker: WorkerExt; type: 'add' | 'deduct' } | null>(null);
  const [adjustScore, setAdjustScore] = useState(5);
  const [adjustReason, setAdjustReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [wRes, cdRes] = await Promise.all([
          get<Worker[]>('/workers'),
          get<CreditDistribution>('/workers/credit-distribution'),
        ]);
        if (wRes.success && Array.isArray(wRes.data)) setWorkers(wRes.data.map(w => ({ ...w, creditRecords: [] })));
        if (cdRes.success) setCreditDist(cdRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredWorkers = workers.filter(w => {
    if (search && !w.name.includes(search) && !w.phone.includes(search)) return false;
    if (scoreFilter) {
      if (scoreFilter === 'excellent' && w.creditScore < 85) return false;
      if (scoreFilter === 'good' && (w.creditScore < 70 || w.creditScore >= 85)) return false;
      if (scoreFilter === 'fair' && (w.creditScore < 55 || w.creditScore >= 70)) return false;
      if (scoreFilter === 'poor' && (w.creditScore < 40 || w.creditScore >= 55)) return false;
      if (scoreFilter === 'veryPoor' && w.creditScore >= 40) return false;
    }
    return true;
  }).sort((a, b) => b.creditScore - a.creditScore);

  const histogramData = creditDist?.ranges?.length
    ? creditDist.ranges.map(r => ({ range: r.label, count: r.count }))
    : [
        { range: '0-39', count: workers.filter(w => w.creditScore < 40).length },
        { range: '40-54', count: workers.filter(w => w.creditScore >= 40 && w.creditScore < 55).length },
        { range: '55-69', count: workers.filter(w => w.creditScore >= 55 && w.creditScore < 70).length },
        { range: '70-84', count: workers.filter(w => w.creditScore >= 70 && w.creditScore < 85).length },
        { range: '85-100', count: workers.filter(w => w.creditScore >= 85).length },
      ];

  const handleAdjustSubmit = async () => {
    if (!adjustModal || !adjustReason.trim()) return;
    const { worker, type } = adjustModal;
    const delta = type === 'add' ? adjustScore : -adjustScore;
    const newScore = Math.max(0, Math.min(100, worker.creditScore + delta));
    const res = await patch<Worker>(`/workers/${worker.id}/credit-score`, { score: newScore, reason: adjustReason });
    if (res.success) {
      const newRecord: CreditRecord = {
        id: 'c' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type,
        score: adjustScore,
        reason: adjustReason,
        operator: '管理员',
      };
      setWorkers(prev => prev.map(w => {
        if (w.id !== worker.id) return w;
        return { ...w, creditScore: newScore, creditRecords: [newRecord, ...(w.creditRecords || [])] };
      }));
    }
    setAdjustModal(null);
    setAdjustScore(5);
    setAdjustReason('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">工人信用分管理</h1>
        <p className="text-gray-500 text-sm mt-1">信用体系 · 分档管理 · 加减分明细</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 mb-5">
        <div className="card p-5 xl:col-span-1">
          <h3 className="section-title mb-4"><Award className="w-5 h-5 text-brand-600" /> 信用分分布柱状图</h3>
          {histogramData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400">暂无数据</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip />
                  <Bar dataKey="count" name="人数" radius={[6, 6, 0, 0]}>
                    {histogramData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[Math.min(i, 4)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5 xl:col-span-3">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-4">
            <h3 className="section-title"><User className="w-5 h-5 text-accent-600" /> 工人列表（{filteredWorkers.length}）</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field pl-9 max-w-[240px] text-sm py-2" placeholder="搜索姓名/手机号" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select className="input-field max-w-[160px] text-sm py-2" value={scoreFilter} onChange={e => setScoreFilter(e.target.value)}>
                  <option value="">全部档位</option>
                  <option value="excellent">优秀 (85+)</option>
                  <option value="good">良好 (70-84)</option>
                  <option value="fair">一般 (55-69)</option>
                  <option value="poor">较差 (40-54)</option>
                  <option value="veryPoor">危险 (0-39)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <th className="text-left font-medium px-4 py-3 w-8"></th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">工人信息</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">性别/年龄</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">信用分</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">状态</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">身份认证</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">技能数</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">履约记录</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-16 text-center text-gray-400">暂无数据</td></tr>
                )}
                {filteredWorkers.map(w => {
                  const grade = getScoreGrade(w.creditScore);
                  const isExpanded = expandedId === w.id;
                  return (
                    <Fragment key={w.id}>
                      <tr
                        className={cn('border-b border-gray-50 hover:bg-brand-50/30 cursor-pointer transition', isExpanded && 'bg-brand-50/40')}
                        onClick={() => setExpandedId(isExpanded ? null : w.id)}>
                        <td className="px-4 py-3">{isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">{w.name.charAt(0)}</div>
                            <div>
                              <div className="font-semibold text-gray-900">{w.name}</div>
                              <div className="text-xs text-gray-400">{w.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          <span className="tag border-gray-200 text-gray-600">{w.gender === 'male' ? '男' : '女'}</span>
                          <span className="ml-2 text-gray-500">{w.age}岁</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={cn('font-bold text-lg w-12 h-12 rounded-xl flex items-center justify-center', getScoreColor(w.creditScore))}>{w.creditScore}</div>
                            <span className={cn('badge text-white', grade.cls)}>{grade.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn('badge',
                            w.status === 'employed' ? 'bg-success-50 text-success-600' :
                            w.status === 'interviewing' ? 'bg-blue-50 text-blue-600' :
                            w.status === 'resigned' ? 'bg-danger-50 text-danger-600' :
                            'bg-gray-100 text-gray-600'
                          )}>{WORKER_STATUS_MAP[w.status]}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {w.idCardVerified
                            ? <span className="badge bg-success-50 text-success-600 gap-1"><CheckCircle className="w-3 h-3" />已认证</span>
                            : <span className="badge bg-danger-50 text-danger-600 gap-1"><XCircle className="w-3 h-3" />未认证</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-brand-600">{w.skills.length}</span>
                          <span className="text-xs text-gray-400 ml-1">项</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{w.performanceHistory.length}</span>
                          <span className="text-xs text-gray-400 ml-1">次</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button className="btn-primary px-3 py-1.5 text-xs gap-1" onClick={e => { e.stopPropagation(); setAdjustModal({ worker: w, type: 'add' }); }}>
                            <Plus className="w-3 h-3" />加分
                          </button>
                          <button className="btn-ghost px-3 py-1.5 text-xs gap-1 ml-2 text-danger-600 border-danger-200 hover:bg-danger-50" onClick={e => { e.stopPropagation(); setAdjustModal({ worker: w, type: 'deduct' }); }}>
                            <Minus className="w-3 h-3" />扣分
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/80">
                          <td colSpan={9} className="px-4 py-5 border-b border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-brand-600" /> 技能认证列表</h4>
                                {w.skills.length === 0 ? (
                                  <div className="text-sm text-gray-400 py-4 text-center">暂无技能认证</div>
                                ) : (
                                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {w.skills.map((s: SkillCert, i) => (
                                      <div key={i} className="bg-white rounded-xl border border-gray-100 p-3">
                                        <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">颁发机构：{s.issuer}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">认证时间：{s.certifiedAt}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-accent-600" /> 履约记录</h4>
                                {w.performanceHistory.length === 0 ? (
                                  <div className="text-sm text-gray-400 py-4 text-center">暂无记录</div>
                                ) : (
                                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {w.performanceHistory.map((p: PerformanceRecord, i) => (
                                      <div key={i} className="bg-white rounded-xl border border-gray-100 p-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="font-semibold text-gray-900 text-sm">{p.factoryName}</div>
                                          {p.endDate
                                            ? <span className={cn('badge text-xs', (LEAVE_TYPE_MAP[p.leaveType ?? 'normal'] || LEAVE_TYPE_MAP.normal).cls)}>
                                                {(LEAVE_TYPE_MAP[p.leaveType ?? 'normal'] || LEAVE_TYPE_MAP.normal).label}
                                              </span>
                                            : <span className="badge bg-success-50 text-success-600 text-xs">在职中</span>}
                                        </div>
                                        <div className="text-xs text-brand-600 font-medium">{p.jobTitle}</div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
                                          <span>在岗 <b className="text-gray-700">{p.daysWorked}</b> 天</span>
                                        </div>
                                        {p.leaveReason && <div className="text-xs text-gray-400 mt-1">离职原因：{p.leaveReason}</div>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-600" /> 信用分来源</h4>
                                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                                  <p className="text-sm text-gray-700">{generateCreditSource(w)}</p>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-accent-600" /> 加减分记录</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {(w.creditRecords || []).length === 0 && <div className="text-sm text-gray-400 py-4 text-center">暂无记录</div>}
                                  {(w.creditRecords || []).map(r => (
                                    <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3">
                                      <div className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                        r.type === 'add' ? 'bg-success-50' : 'bg-danger-50'
                                      )}>
                                        {r.type === 'add' ? <Plus className="w-4 h-4 text-success-600" /> : <Minus className="w-4 h-4 text-danger-600" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className={cn('font-bold', r.type === 'add' ? 'text-success-600' : 'text-danger-600')}>{r.type === 'add' ? '+' : '-'}{r.score}分</span>
                                          <span className="text-xs text-gray-400 shrink-0">{r.date}</span>
                                        </div>
                                        <div className="text-sm text-gray-700 mt-0.5">{r.reason}</div>
                                        <div className="text-xs text-gray-400 mt-1">操作人：{r.operator}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adjustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-hover p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                {adjustModal.type === 'add'
                  ? <span className="text-success-600"><Plus className="w-5 h-5 inline" /> 信用加分</span>
                  : <span className="text-danger-600"><Minus className="w-5 h-5 inline" /> 信用扣分</span>}
              </h3>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition" onClick={() => setAdjustModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">{adjustModal.worker.name.charAt(0)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{adjustModal.worker.name}</div>
                  <div className="text-xs text-gray-500">当前信用分：<span className={cn('font-bold', getScoreColor(adjustModal.worker.creditScore).split(' ')[0])}>{adjustModal.worker.creditScore}</span></div>
                </div>
                <div className="text-2xl font-bold text-gray-300">→</div>
                <div className={cn('text-2xl font-bold w-14 h-14 rounded-xl flex items-center justify-center',
                  getScoreColor(adjustModal.type === 'add' ? adjustModal.worker.creditScore + adjustScore : adjustModal.worker.creditScore - adjustScore))}>
                  {adjustModal.type === 'add' ? adjustModal.worker.creditScore + adjustScore : Math.max(0, adjustModal.worker.creditScore - adjustScore)}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">调整分数</label>
              <div className="flex items-center gap-3">
                <button className="btn-ghost w-10 h-10 p-0" onClick={() => setAdjustScore(Math.max(1, adjustScore - 1))}><Minus className="w-4 h-4" /></button>
                <input type="range" min={1} max={adjustModal.type === 'deduct' ? Math.min(40, adjustModal.worker.creditScore) : 30} value={adjustScore} onChange={e => setAdjustScore(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                <button className="btn-ghost w-10 h-10 p-0" onClick={() => setAdjustScore(Math.min(adjustModal.type === 'deduct' ? Math.min(40, adjustModal.worker.creditScore) : 30, adjustScore + 1))}><Plus className="w-4 h-4" /></button>
                <div className={cn('w-16 text-center text-xl font-bold rounded-xl py-2', adjustModal.type === 'add' ? 'text-success-600 bg-success-50' : 'text-danger-600 bg-danger-50')}>
                  {adjustModal.type === 'add' ? '+' : '-'}{adjustScore}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">调整原因 <span className="text-danger-500">*</span></label>
              <textarea className="input-field min-h-[90px] resize-none" placeholder="请详细说明加减分的具体原因..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
              <div className="flex flex-wrap gap-2 mt-2">
                {adjustModal.type === 'add'
                  ? ['表现优秀推荐', '按期完整履约', '身份认证完成', '推荐优质工人'].map(t => (
                    <button key={t} className="tag border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 transition" onClick={() => setAdjustReason(t)}>{t}</button>
                  ))
                  : ['旷工迟到', '异常离职', '违纪违规', '面试爽约'].map(t => (
                    <button key={t} className="tag border-danger-200 bg-danger-50 text-danger-600 hover:bg-danger-100 transition" onClick={() => setAdjustReason(t)}>{t}</button>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn-ghost flex-1" onClick={() => setAdjustModal(null)}>取消</button>
              <button className={cn('flex-1', adjustModal.type === 'add' ? 'btn-primary' : 'bg-danger-500 hover:bg-danger-600 text-white font-medium px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 shadow-card')}
                onClick={handleAdjustSubmit} disabled={!adjustReason.trim()}>
                确认{adjustModal.type === 'add' ? '加分' : '扣分'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


